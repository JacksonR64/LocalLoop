import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendEventCancellationEmail } from '@/lib/email-service'
import { z } from 'zod'

// Event cancellation request schema
const eventCancellationSchema = z.object({
    event_id: z.string().min(1, 'Event ID is required'),
    cancellation_reason: z.string().min(1, 'Cancellation reason is required'),
    refund_timeframe: z.string().default('5-7 business days'),
    alternative_events: z.array(z.object({
        title: z.string(),
        date: z.string(),
        location: z.string(),
        url: z.string().optional()
    })).optional(),
})

/**
 * POST /api/events/cancellation
 * Send event cancellation emails to all attendees and update event status
 * 
 * This endpoint:
 * 1. Marks the event as cancelled in the database
 * 2. Sends cancellation emails to all RSVP and ticket holders
 * 3. Provides refund information for ticket holders
 * 4. Suggests alternative events if provided
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServerSupabaseClient()

        // Validate request body
        const result = eventCancellationSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: result.error.issues },
                { status: 400 }
            )
        }

        const { event_id, cancellation_reason, refund_timeframe } = result.data

        // Get current user (must be organizer)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get event details and verify organizer
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
                organizer_id,
                users:organizer_id (
                    id,
                    email,
                    display_name
                )
            `)
            .eq('id', event_id)
            .single()

        if (eventError || !event) {
            console.error('Event lookup error:', eventError)
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        // Verify user is the organizer
        if (event.organizer_id !== user.id) {
            return NextResponse.json(
                { error: 'Only the event organizer can cancel events' },
                { status: 403 }
            )
        }

        // Check if event is already cancelled
        if (event.cancelled) {
            return NextResponse.json(
                { error: 'Event is already cancelled' },
                { status: 400 }
            )
        }

        // Update event status to cancelled
        const { error: updateError } = await supabase
            .from('events')
            .update({
                cancelled: true,
                cancelled_at: new Date().toISOString(),
                cancellation_reason
            })
            .eq('id', event_id)

        if (updateError) {
            console.error('Error updating event status:', updateError)
            return NextResponse.json(
                { error: 'Failed to cancel event' },
                { status: 500 }
            )
        }

        // Get attendees (users who have RSVPs or tickets)
        const { data: rsvps } = await supabase
            .from('rsvps')
            .select(`
                users!inner (
                    id,
                    email,
                    full_name
                )
            `)
            .eq('event_id', event_id)
            .eq('status', 'attending')

        // Also get ticket purchasers
        const { data: ticketUsers } = await supabase
            .from('orders')
            .select(`
                users!inner (
                    id,
                    email, 
                    full_name
                )
            `)
            .eq('event_id', event_id)

        // Define interface for user data from Supabase joins
        interface UserData {
            id: string;
            email: string;
            full_name: string;
        }

        // Combine and deduplicate attendees
        const allUsers: UserData[] = [
            ...(rsvps || []).map(r => r.users).filter(Boolean),
            ...(ticketUsers || []).map(t => t.users).filter(Boolean)
        ].flat()

        // Remove duplicates by email
        const uniqueAttendees = allUsers.filter((user, index, self) =>
            index === self.findIndex((u: UserData) => u.email === user.email)
        )

        // Check if event has any attendees
        if (uniqueAttendees.length === 0) {
            return NextResponse.json({
                message: 'Event cancelled successfully',
                attendees_notified: 0
            })
        }

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

        // Send cancellation emails
        let emailsSent = 0
        const attendees = uniqueAttendees

        const emailResults = []
        let successCount = 0
        let failureCount = 0

        for (const attendee of attendees) {
            try {
                const emailResult = await sendEventCancellationEmail({
                    to: attendee.email,
                    userName: attendee.full_name,
                    userEmail: attendee.email,
                    eventTitle: event.title,
                    eventDescription: event.description || 'No description provided',
                    eventDate,
                    eventTime,
                    eventLocation: event.location,
                    eventAddress: event.location_details || event.location,
                    organizerName: organizerData?.display_name || 'Event Organizer',
                    organizerEmail: organizerData?.email || 'organizer@localloopevents.xyz',
                    cancellationReason: cancellation_reason,
                    refundAmount: 0, // Assuming refundAmount is not provided in the attendees
                    refundTimeframe: refund_timeframe,
                    eventSlug: event.slug,
                })

                if (emailResult.success) {
                    successCount++
                    emailsSent++
                    emailResults.push({
                        email: attendee.email,
                        status: 'sent',
                        messageId: emailResult.messageId
                    })
                } else {
                    failureCount++
                    emailResults.push({
                        email: attendee.email,
                        status: 'failed',
                        error: emailResult.error
                    })
                    console.error(`Failed to send cancellation email to ${attendee.email}:`, emailResult.error)
                }

            } catch (emailError) {
                failureCount++
                emailResults.push({
                    email: attendee.email,
                    status: 'failed',
                    error: String(emailError)
                })
                console.error(`Error sending cancellation email to ${attendee.email}:`, emailError)
            }
        }

        // Update RSVP statuses to cancelled
        if (rsvps && rsvps.length > 0) {
            const { error: rsvpUpdateError } = await supabase
                .from('rsvps')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('event_id', event_id)
                .eq('status', 'attending')

            if (rsvpUpdateError) {
                console.warn('Failed to update RSVP statuses:', rsvpUpdateError)
            }
        }

        // Update ticket statuses to cancelled (for tracking, refunds handled separately)
        if (ticketUsers && ticketUsers.length > 0) {
            const { error: ticketUpdateError } = await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('event_id', event_id)
                .eq('status', 'active')

            if (ticketUpdateError) {
                console.warn('Failed to update ticket statuses:', ticketUpdateError)
            }
        }

        // Log cancellation activity
        console.log(`Event cancelled: ${event.title} (${event_id}): ${successCount} notifications sent, ${failureCount} failed`)

        return NextResponse.json({
            message: `Event cancelled and notifications sent`,
            event_title: event.title,
            cancelled: true,
            total_attendees: emailsSent,
            sent_count: successCount,
            failed_count: failureCount,
            results: emailResults
        })

    } catch (error) {
        console.error('Unexpected error in POST /api/events/cancellation:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 