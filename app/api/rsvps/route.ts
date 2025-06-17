import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendRSVPConfirmationEmail } from '@/lib/email-service'
import { z } from 'zod'

// Performance optimization: Simple in-memory cache for RSVP checks (5 minutes)
const rsvpCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// RSVP creation schema
const rsvpSchema = z.object({
    event_id: z.string().min(1, 'Event ID is required'),
    // For logged-in users
    user_id: z.string().uuid().optional(),
    // For guest users
    guest_email: z.string().email().optional(),
    guest_name: z.string().min(1).optional(),
    // RSVP details
    notes: z.string().optional(),
}).refine(
    (data) => (data.user_id && !data.guest_email) || (!data.user_id && data.guest_email && data.guest_name),
    {
        message: "Either user_id OR guest_email and guest_name must be provided",
        path: ["user_id"],
    }
)

// GET /api/rsvps - Get RSVPs for current user or check specific RSVP
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get('eventId')
        const userId = searchParams.get('userId')

        // If specific eventId and userId are provided, check for specific RSVP
        if (eventId && userId) {
            // Ensure the requesting user can only check their own RSVPs
            if (userId !== user.id) {
                return NextResponse.json(
                    { error: 'Unauthorized to check other users\' RSVPs' },
                    { status: 403 }
                )
            }

            // Check cache first
            const cacheKey = `rsvp:${eventId}:${userId}`
            const cached = rsvpCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                return NextResponse.json(cached.data)
            }

            // Optimize: Use more specific query
            const { data: rsvp, error } = await supabase
                .from('rsvps')
                .select(`
                    id,
                    event_id,
                    user_id,
                    status,
                    created_at,
                    events:event_id (
                        id,
                        title,
                        start_time,
                        end_time,
                        location,
                        image_url
                    )
                `)
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .eq('status', 'confirmed')
                .maybeSingle()

            if (error) {
                console.error('Error checking specific RSVP:', error)
                return NextResponse.json(
                    { error: 'Failed to check RSVP' },
                    { status: 500 }
                )
            }

            const result = {
                hasRSVP: !!rsvp,
                rsvp: rsvp || null
            }

            // Cache the result
            rsvpCache.set(cacheKey, { data: result, timestamp: Date.now() })

            return NextResponse.json(result)
        }

        // Default behavior: get all RSVPs for current user with optimization
        const { data: rsvps, error } = await supabase
            .from('rsvps')
            .select(`
                id,
                event_id,
                status,
                created_at,
                notes,
                events:event_id (
                    id,
                    title,
                    start_time,
                    end_time,
                    location,
                    image_url
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false })
            .limit(50) // Limit results for performance

        if (error) {
            console.error('Error fetching RSVPs:', error)
            return NextResponse.json(
                { error: 'Failed to fetch RSVPs' },
                { status: 500 }
            )
        }

        return NextResponse.json({ rsvps })
    } catch (error) {
        console.error('Unexpected error in GET /api/rsvps:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/rsvps - Create new RSVP
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServerSupabaseClient()

        // Get current user BEFORE validation (important for validation logic)
        const { data: { user } } = await supabase.auth.getUser()

        // If user is authenticated, add user_id to body for validation
        const bodyWithAuth = user
            ? { ...body, user_id: user.id }
            : body

        // Validate request body (now includes user_id if authenticated)
        const result = rsvpSchema.safeParse(bodyWithAuth)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: result.error.format() },
                { status: 400 }
            )
        }

        const rsvpData = result.data

        // If user is logged in, use their ID, otherwise use guest info
        const finalRsvpData = user
            ? {
                event_id: rsvpData.event_id,
                user_id: user.id,
                notes: rsvpData.notes,
                status: 'confirmed' as const,
            }
            : {
                event_id: rsvpData.event_id,
                guest_email: rsvpData.guest_email!,
                guest_name: rsvpData.guest_name!,
                notes: rsvpData.notes,
                status: 'confirmed' as const,
            }

        // Check if event exists and is open for registration with optimized query
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select(`
                id, 
                title, 
                description,
                start_time,
                end_time,
                location,
                location_details,
                slug,
                published,
                cancelled,
                capacity,
                users:organizer_id (
                    id,
                    email,
                    display_name
                )
            `)
            .eq('id', rsvpData.event_id)
            .single()

        if (eventError || !event) {
            console.error('Event lookup error:', eventError)
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        // Check if event is published and not cancelled (instead of is_open_for_registration)
        if (!event.published || event.cancelled) {
            return NextResponse.json(
                { error: 'Event is not open for registration' },
                { status: 400 }
            )
        }

        // Get current RSVP count from the rsvps table
        const { count: currentRsvpCount, error: countError } = await supabase
            .from('rsvps')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', rsvpData.event_id)
            .eq('status', 'confirmed')

        if (countError) {
            console.error('Error counting RSVPs:', countError)
            return NextResponse.json(
                { error: 'Failed to check event capacity' },
                { status: 500 }
            )
        }

        // Check capacity if event has a limit
        if (event.capacity && currentRsvpCount !== null && currentRsvpCount >= event.capacity) {
            return NextResponse.json(
                { error: 'Event is at full capacity' },
                { status: 400 }
            )
        }

        // Check if user/guest already has an RSVP for this event
        const existingRsvpQuery = user
            ? supabase
                .from('rsvps')
                .select('id')
                .eq('event_id', rsvpData.event_id)
                .eq('user_id', user.id)
                .eq('status', 'confirmed')
            : supabase
                .from('rsvps')
                .select('id')
                .eq('event_id', rsvpData.event_id)
                .eq('guest_email', rsvpData.guest_email!)
                .eq('status', 'confirmed')

        const { data: existingRsvp, error: existingError } = await existingRsvpQuery.maybeSingle()

        if (existingError) {
            console.error('Error checking existing RSVP:', existingError)
            return NextResponse.json(
                { error: 'Failed to check existing RSVP' },
                { status: 500 }
            )
        }

        if (existingRsvp) {
            return NextResponse.json(
                { error: 'You have already RSVP\'d to this event' },
                { status: 409 }
            )
        }

        // Create the RSVP
        const { data: newRsvp, error: createError } = await supabase
            .from('rsvps')
            .insert(finalRsvpData)
            .select()
            .single()

        if (createError) {
            console.error('Error creating RSVP:', createError)
            return NextResponse.json(
                { error: 'Failed to create RSVP' },
                { status: 500 }
            )
        }

        // Clear cache for this event/user combination
        if (user) {
            const cacheKey = `rsvp:${rsvpData.event_id}:${user.id}`
            rsvpCache.delete(cacheKey)
        }

        // Send confirmation email (non-blocking for performance)
        const emailRecipient = user ? user.email : rsvpData.guest_email!
        const recipientName = user
            ? (user.user_metadata?.display_name || user.email?.split('@')[0] || 'Guest')
            : rsvpData.guest_name!

        // Send confirmation email (async, don't block response)
        if (emailRecipient) {
            // Handle organizer data from Supabase join
            const organizer = Array.isArray(event.users) ? event.users[0] : event.users
            const organizerData = organizer as { id: string; email: string; display_name: string } | null

            // Format date and time for email
            const eventDate = new Date(event.start_time).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })

            const eventTime = new Date(event.start_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })

            // Calculate cancellation deadline (24 hours before event)
            const cancellationDeadline = new Date(new Date(event.start_time).getTime() - 24 * 60 * 60 * 1000)
                .toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                })

            // Don't await email sending to improve response time
            sendRSVPConfirmationEmail({
                to: emailRecipient,
                userName: recipientName,
                userEmail: emailRecipient,
                eventTitle: event.title,
                eventDescription: event.description || 'No description provided',
                eventDate,
                eventTime,
                eventLocation: event.location,
                eventAddress: event.location_details || event.location,
                organizerName: organizerData?.display_name || 'Event Organizer',
                organizerEmail: organizerData?.email || 'organizer@localloop.app',
                rsvpId: newRsvp.id,
                guestCount: 1,
                isAuthenticated: !!user,
                eventSlug: event.slug,
                cancellationDeadline
            }).catch(error => {
                console.error('Failed to send RSVP confirmation email:', error)
            })
        }

        return NextResponse.json({
            message: 'RSVP created successfully',
            rsvp: newRsvp
        }, { status: 201 })

    } catch (error) {
        console.error('Unexpected error in POST /api/rsvps:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/rsvps - Cancel RSVP
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get('eventId')

        if (!eventId) {
            return NextResponse.json(
                { error: 'Event ID is required' },
                { status: 400 }
            )
        }

        // Find and delete the RSVP
        const { data: deletedRsvp, error } = await supabase
            .from('rsvps')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .select()
            .single()

        if (error) {
            console.error('Error deleting RSVP:', error)
            return NextResponse.json(
                { error: 'Failed to cancel RSVP' },
                { status: 500 }
            )
        }

        // Clear cache for this event/user combination
        const cacheKey = `rsvp:${eventId}:${user.id}`
        rsvpCache.delete(cacheKey)

        return NextResponse.json({
            message: 'RSVP cancelled successfully',
            rsvp: deletedRsvp
        })

    } catch (error) {
        console.error('Unexpected error in DELETE /api/rsvps:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 