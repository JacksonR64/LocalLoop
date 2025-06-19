import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendEventReminderEmail } from '@/lib/email-service'
import { EMAIL_ADDRESSES } from '@/lib/config/email-addresses'
import { z } from 'zod'

// Event reminder request schema
const eventReminderSchema = z.object({
    event_id: z.string().min(1, 'Event ID is required'),
    reminder_type: z.enum(['24h', '1h', 'custom'], {
        errorMap: () => ({ message: 'Reminder type must be 24h, 1h, or custom' })
    }),
    custom_message: z.string().optional(),
    recipient_filter: z.enum(['all', 'rsvp_only', 'ticket_holders_only']).default('all'),
})

/**
 * POST /api/events/reminders
 * Send event reminder emails to attendees
 * 
 * This endpoint can be called:
 * 1. By a scheduled job (cron) for automatic reminders
 * 2. Manually by event organizers
 * 3. By the system for custom reminder scenarios
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServerSupabaseClient()

        // Validate request body
        const result = eventReminderSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: result.error.format() },
                { status: 400 }
            )
        }

        const { event_id, reminder_type, recipient_filter } = result.data

        // Get event details with organizer info
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

        // Check if event is published and not cancelled
        if (!event.published || event.cancelled) {
            return NextResponse.json(
                { error: 'Cannot send reminders for unpublished or cancelled events' },
                { status: 400 }
            )
        }

        // Check if event is in the future
        const eventStartTime = new Date(event.start_time)
        const now = new Date()
        if (eventStartTime <= now) {
            return NextResponse.json(
                { error: 'Cannot send reminders for past events' },
                { status: 400 }
            )
        }

        // Get attendees based on filter
        // eslint-disable-next-line prefer-const
        let attendees: Array<{
            email: string
            name: string
            type: 'rsvp' | 'ticket'
            rsvp_id?: string
            ticket_count?: number
        }> = []

        // Get RSVP attendees
        if (recipient_filter === 'all' || recipient_filter === 'rsvp_only') {
            const { data: rsvpAttendees, error: rsvpError } = await supabase
                .from('rsvps')
                .select(`
                    id,
                    user_id,
                    guest_email,
                    guest_name,
                    users:user_id (
                        email,
                        display_name
                    )
                `)
                .eq('event_id', event_id)
                .eq('status', 'confirmed')

            if (rsvpError) {
                console.error('Error fetching RSVP attendees:', rsvpError)
            } else if (rsvpAttendees) {
                for (const rsvp of rsvpAttendees) {
                    const userInfo = Array.isArray(rsvp.users) ? rsvp.users[0] : rsvp.users
                    const email = rsvp.user_id ? userInfo?.email : rsvp.guest_email
                    const name = rsvp.user_id
                        ? (userInfo?.display_name || userInfo?.email?.split('@')[0] || 'User')
                        : (rsvp.guest_name || 'Guest')

                    if (email) {
                        attendees.push({
                            email,
                            name,
                            type: 'rsvp',
                            rsvp_id: rsvp.id
                        })
                    }
                }
            }
        }

        // Get ticket holders
        if (recipient_filter === 'all' || recipient_filter === 'ticket_holders_only') {
            const { data: ticketHolders, error: ticketError } = await supabase
                .from('tickets')
                .select(`
                    user_id,
                    customer_email,
                    customer_name,
                    users:user_id (
                        email,
                        display_name
                    )
                `)
                .eq('event_id', event_id)
                .eq('status', 'active')

            if (ticketError) {
                console.error('Error fetching ticket holders:', ticketError)
            } else if (ticketHolders) {
                // Group tickets by email to get ticket count
                const ticketGroups = ticketHolders.reduce((groups, ticket) => {
                    const userInfo = Array.isArray(ticket.users) ? ticket.users[0] : ticket.users
                    const email = ticket.user_id ? userInfo?.email : ticket.customer_email
                    const name = ticket.user_id
                        ? (userInfo?.display_name || userInfo?.email?.split('@')[0] || 'User')
                        : (ticket.customer_name || 'Customer')

                    if (email) {
                        if (!groups[email]) {
                            groups[email] = { email, name, count: 0 }
                        }
                        groups[email].count++
                    }
                    return groups
                }, {} as Record<string, { email: string; name: string; count: number }>)

                for (const group of Object.values(ticketGroups)) {
                    attendees.push({
                        email: group.email,
                        name: group.name,
                        type: 'ticket',
                        ticket_count: group.count
                    })
                }
            }
        }

        // Remove duplicates (users who both RSVP'd and bought tickets)
        const uniqueAttendees = attendees.reduce((unique, attendee) => {
            const existing = unique.find(a => a.email === attendee.email)
            if (!existing) {
                unique.push(attendee)
            } else if (attendee.type === 'ticket' && existing.type === 'rsvp') {
                // Prefer ticket holder info over RSVP
                unique[unique.indexOf(existing)] = attendee
            }
            return unique
        }, [] as typeof attendees)

        if (uniqueAttendees.length === 0) {
            return NextResponse.json({
                message: 'No attendees found for this event',
                sent_count: 0
            })
        }

        // Calculate time until event for dynamic content
        const timeUntilEvent = getTimeUntilEvent(eventStartTime, reminder_type)

        // Handle organizer data from Supabase join
        const organizer = Array.isArray(event.users) ? event.users[0] : event.users
        const organizerData = organizer as { id: string; email: string; display_name: string } | null

        // Format date and time for email
        const eventDate = eventStartTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const eventTime = eventStartTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })

        // Send reminder emails
        const emailResults = []
        let successCount = 0
        let failureCount = 0

        for (const attendee of uniqueAttendees) {
            try {
                const emailResult = await sendEventReminderEmail({
                    to: attendee.email,
                    userName: attendee.name,
                    userEmail: attendee.email,
                    eventTitle: event.title,
                    eventDescription: event.description || 'No description provided',
                    eventDate,
                    eventTime,
                    eventLocation: event.location,
                    eventAddress: event.location_details || event.location,
                    organizerName: organizerData?.display_name || 'Event Organizer',
                    organizerEmail: organizerData?.email || EMAIL_ADDRESSES.ORGANIZER,
                    rsvpId: attendee.rsvp_id,
                    isTicketHolder: attendee.type === 'ticket',
                    ticketCount: attendee.ticket_count,
                    reminderType: reminder_type,
                    eventSlug: event.slug,
                    timeUntilEvent,
                })

                if (emailResult.success) {
                    successCount++
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
                    console.error(`Failed to send reminder to ${attendee.email}:`, emailResult.error)
                }

            } catch (emailError) {
                failureCount++
                emailResults.push({
                    email: attendee.email,
                    status: 'failed',
                    error: String(emailError)
                })
                console.error(`Error sending reminder to ${attendee.email}:`, emailError)
            }
        }

        // Log reminder activity
        console.log(`Event reminder sent for ${event.title} (${event_id}): ${successCount} sent, ${failureCount} failed`)

        return NextResponse.json({
            message: `Event reminders processed`,
            event_title: event.title,
            reminder_type,
            total_attendees: uniqueAttendees.length,
            sent_count: successCount,
            failed_count: failureCount,
            results: emailResults
        })

    } catch (error) {
        console.error('Unexpected error in POST /api/events/reminders:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Helper function to calculate time until event for dynamic content
 */
function getTimeUntilEvent(eventStartTime: Date, reminderType: string): string {
    const now = new Date()
    const timeDiff = eventStartTime.getTime() - now.getTime()

    const hours = Math.floor(timeDiff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (reminderType === '24h') {
        return 'tomorrow'
    } else if (reminderType === '1h') {
        return 'in 1 hour'
    } else if (days > 1) {
        return `in ${days} days`
    } else if (hours > 1) {
        return `in ${hours} hours`
    } else {
        return 'soon'
    }
} 