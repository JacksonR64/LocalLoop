import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Performance optimization: Simple in-memory cache for event details (10 minutes)
interface EventCacheData {
    event: {
        id: string;
        title: string;
        slug?: string;
        description?: string;
        short_description?: string;
        start_time: string;
        end_time: string;
        timezone?: string;
        location?: string;
        location_details?: string;
        latitude?: number;
        longitude?: number;
        is_online: boolean;
        online_url?: string;
        category?: string;
        tags?: string[];
        capacity?: number;
        is_paid: boolean;
        image_url?: string;
        image_alt_text?: string;
        featured: boolean;
        published: boolean;
        cancelled: boolean;
        created_at: string;
        updated_at: string;
        organizer_id: string;
        organizer?: {
            id: string;
            display_name?: string;
            avatar_url?: string;
        };
    };
}
const eventCache = new Map<string, { data: EventCacheData; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id: eventId } = await params

        // Check cache first
        const cacheKey = `event:${eventId}`
        const cached = eventCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json(cached.data)
        }

        // Get event with organizer details - optimized query
        const { data: event, error } = await supabase
            .from('events')
            .select(`
                id,
                title,
                slug,
                description,
                short_description,
                start_time,
                end_time,
                timezone,
                location,
                location_details,
                latitude,
                longitude,
                is_online,
                online_url,
                category,
                tags,
                capacity,
                is_paid,
                image_url,
                image_alt_text,
                featured,
                published,
                cancelled,
                created_at,
                updated_at,
                organizer_id,
                organizer:users!organizer_id(
                    id,
                    display_name,
                    avatar_url
                )
            `)
            .eq('id', eventId)
            .single()

        if (error || !event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        const result = { event }

        // Cache the result
        eventCache.set(cacheKey, { data: result, timestamp: Date.now() })

        return NextResponse.json(result)

    } catch (error) {
        console.error('Error in GET /api/events/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id: eventId } = await params

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user details and verify role
        const { data: userDetails } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', user.id)
            .single()

        if (!userDetails || !['organizer', 'admin'].includes(userDetails.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions. Only organizers and admins can edit events.' },
                { status: 403 }
            )
        }

        // Get the existing event
        const { data: existingEvent, error: fetchError } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single()

        if (fetchError || !existingEvent) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        // Check if user can edit this event (admins can edit any event, organizers can only edit their own)
        if (userDetails.role === 'organizer' && existingEvent.organizer_id !== user.id) {
            return NextResponse.json(
                { error: 'You can only edit events that you created' },
                { status: 403 }
            )
        }

        const body = await request.json()

        // Validate dates if provided
        if (body.start_time && body.end_time) {
            const startTime = new Date(body.start_time)
            const endTime = new Date(body.end_time)

            if (startTime >= endTime) {
                return NextResponse.json(
                    { error: 'End time must be after start time' },
                    { status: 400 }
                )
            }
        }

        // Validate slug format if provided
        if (body.slug && !/^[a-z0-9-]+$/.test(body.slug)) {
            return NextResponse.json(
                { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
                { status: 400 }
            )
        }

        // Check if slug already exists (for other events)
        if (body.slug && body.slug !== existingEvent.slug) {
            const { data: existingSlugEvent } = await supabase
                .from('events')
                .select('id')
                .eq('slug', body.slug)
                .neq('id', eventId)
                .single()

            if (existingSlugEvent) {
                return NextResponse.json(
                    { error: 'An event with this slug already exists' },
                    { status: 400 }
                )
            }
        }

        // Validate location requirements if provided
        if (body.hasOwnProperty('is_online')) {
            if (!body.is_online && !body.location && !existingEvent.location) {
                return NextResponse.json(
                    { error: 'Location is required for in-person events' },
                    { status: 400 }
                )
            }

            if (body.is_online && !body.online_url && !existingEvent.online_url) {
                return NextResponse.json(
                    { error: 'Online URL is required for virtual events' },
                    { status: 400 }
                )
            }
        }

        // Validate category if provided
        if (body.category) {
            const validCategories = ['workshop', 'meeting', 'social', 'arts', 'sports', 'family', 'business', 'education', 'other']
            if (!validCategories.includes(body.category)) {
                return NextResponse.json(
                    { error: 'Invalid category' },
                    { status: 400 }
                )
            }
        }

        // Prepare update data (only include fields that are provided)
        const updateData: Record<string, unknown> = {}

        if (body.title !== undefined) updateData.title = body.title.trim()
        if (body.slug !== undefined) updateData.slug = body.slug.trim()
        if (body.description !== undefined) updateData.description = body.description.trim()
        if (body.short_description !== undefined) updateData.short_description = body.short_description?.trim() || null
        if (body.start_time !== undefined) updateData.start_time = new Date(body.start_time).toISOString()
        if (body.end_time !== undefined) updateData.end_time = new Date(body.end_time).toISOString()
        if (body.timezone !== undefined) updateData.timezone = body.timezone
        if (body.location !== undefined) updateData.location = body.location?.trim() || null
        if (body.location_details !== undefined) updateData.location_details = body.location_details?.trim() || null
        if (body.latitude !== undefined) updateData.latitude = body.latitude || null
        if (body.longitude !== undefined) updateData.longitude = body.longitude || null
        if (body.is_online !== undefined) updateData.is_online = body.is_online
        if (body.online_url !== undefined) updateData.online_url = body.online_url?.trim() || null
        if (body.category !== undefined) updateData.category = body.category
        if (body.tags !== undefined) updateData.tags = body.tags || []
        if (body.capacity !== undefined) updateData.capacity = body.capacity || null
        if (body.is_paid !== undefined) updateData.is_paid = body.is_paid
        if (body.image_url !== undefined) updateData.image_url = body.image_url?.trim() || null
        if (body.image_alt_text !== undefined) updateData.image_alt_text = body.image_alt_text?.trim() || null
        if (body.featured !== undefined) updateData.featured = body.featured
        if (body.published !== undefined) updateData.published = body.published
        if (body.cancelled !== undefined) updateData.cancelled = body.cancelled
        if (body.google_calendar_event_template !== undefined) updateData.google_calendar_event_template = body.google_calendar_event_template || {}

        // Always update the updated_at timestamp
        updateData.updated_at = new Date().toISOString()

        // Update the event
        const { data: event, error: updateError } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', eventId)
            .select(`
                *,
                organizer:users!organizer_id(
                    id,
                    display_name,
                    avatar_url
                )
            `)
            .single()

        if (updateError) {
            console.error('Error updating event:', updateError)
            return NextResponse.json(
                { error: 'Failed to update event' },
                { status: 500 }
            )
        }

        // Clear cache for this event
        const cacheKey = `event:${eventId}`
        eventCache.delete(cacheKey)

        return NextResponse.json({
            message: 'Event updated successfully',
            event
        })

    } catch (error) {
        console.error('Error in PATCH /api/events/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id: eventId } = await params

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user details and verify role
        const { data: userDetails } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', user.id)
            .single()

        if (!userDetails || !['organizer', 'admin'].includes(userDetails.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions. Only organizers and admins can delete events.' },
                { status: 403 }
            )
        }

        // Get the existing event to check ownership
        const { data: existingEvent, error: fetchError } = await supabase
            .from('events')
            .select('organizer_id')
            .eq('id', eventId)
            .single()

        if (fetchError || !existingEvent) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        // Check if user can delete this event (admins can delete any event, organizers can only delete their own)
        if (userDetails.role === 'organizer' && existingEvent.organizer_id !== user.id) {
            return NextResponse.json(
                { error: 'You can only delete events that you created' },
                { status: 403 }
            )
        }

        // Delete the event
        const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId)

        if (deleteError) {
            console.error('Error deleting event:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete event' },
                { status: 500 }
            )
        }

        // Clear cache for this event
        const cacheKey = `event:${eventId}`
        eventCache.delete(cacheKey)

        return NextResponse.json({
            message: 'Event deleted successfully'
        })

    } catch (error) {
        console.error('Error in DELETE /api/events/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 