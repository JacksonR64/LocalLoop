import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendRSVPCancellationEmail } from '@/lib/email-service'
import { EMAIL_ADDRESSES } from '@/lib/config/email-addresses'
import { z } from 'zod'

// RSVP update schema
const updateRsvpSchema = z.object({
    status: z.enum(['confirmed', 'cancelled', 'waitlist']).optional(),
    notes: z.string().optional(),
})

// GET /api/rsvps/[id] - Get specific RSVP
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Build query based on authentication status
        let query = supabase
            .from('rsvps')
            .select(`
                *,
                events:event_id (
                    id,
                    title,
                    start_time,
                    end_time,
                    location,
                    image_url
                )
            `)
            .eq('id', id)

        // Apply RLS - users can only see their own RSVPs
        if (user) {
            query = query.eq('user_id', user.id)
        } else {
            // For unauthenticated guests, they need to provide email verification
            // This will be handled by a separate endpoint for security
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        console.log('GET RSVP - User ID:', user.id, 'RSVP ID:', id);

        const { data: rsvp, error } = await query.single()

        if (error || !rsvp) {
            return NextResponse.json(
                { error: 'RSVP not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ rsvp })
    } catch (error) {
        console.error('Unexpected error in GET /api/rsvps/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH /api/rsvps/[id] - Update RSVP (primarily for cancellation)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const supabase = await createServerSupabaseClient()

        // Get current user (optional for guest RSVPs)
        const { data: { user } } = await supabase.auth.getUser()

        // Validate request body
        const result = updateRsvpSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: result.error.format() },
                { status: 400 }
            )
        }

        const updateData = result.data

        // First, verify the RSVP exists and user has permission to modify it
        let existingRsvpQuery = supabase
            .from('rsvps')
            .select(`
                *,
                events:event_id (
                    id,
                    title,
                    start_time
                )
            `)
            .eq('id', id)

        if (user) {
            existingRsvpQuery = existingRsvpQuery.eq('user_id', user.id)
        } else {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        console.log('PATCH RSVP - User ID:', user.id, 'RSVP ID:', id);

        const { data: existingRsvp, error: rsvpError } = await existingRsvpQuery.single()

        if (rsvpError || !existingRsvp) {
            console.error('RSVP lookup error (PATCH):', rsvpError);
            return NextResponse.json(
                { error: 'RSVP not found or access denied' },
                { status: 404 }
            )
        }

        // Check if cancellation is allowed (calculate the 2-hour rule directly)
        if (updateData.status === 'cancelled') {
            const eventStartTime = new Date(existingRsvp.events.start_time);
            const now = new Date();
            const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            
            if (existingRsvp.status !== 'confirmed' || eventStartTime <= twoHoursFromNow) {
                return NextResponse.json(
                    { error: 'RSVP cancellation is not allowed within 2 hours of the event' },
                    { status: 400 }
                )
            }
        }

        // Update the RSVP
        const { data: updatedRsvp, error: updateError } = await supabase
            .from('rsvps')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating RSVP:', updateError)
            return NextResponse.json(
                { error: 'Failed to update RSVP' },
                { status: 500 }
            )
        }

        // Send cancellation confirmation email if status changed to cancelled
        if (updateData.status === 'cancelled') {
            try {
                // Get event details with organizer info for email
                const { data: eventDetails, error: eventError } = await supabase
                    .from('events')
                    .select(`
                        *,
                        users:organizer_id (
                            id,
                            email,
                            full_name
                        )
                    `)
                    .eq('id', existingRsvp.event_id)
                    .single()

                if (eventDetails && !eventError) {
                    const userName = existingRsvp.user_id
                        ? user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
                        : existingRsvp.guest_name || 'Guest';

                    const userEmail = existingRsvp.user_id
                        ? user?.email || EMAIL_ADDRESSES.SYSTEM_FROM
                        : existingRsvp.guest_email || EMAIL_ADDRESSES.SYSTEM_FROM;

                    // Handle organizer data from Supabase join
                    const organizer = Array.isArray(eventDetails.users) ? eventDetails.users[0] : eventDetails.users;
                    const organizerData = organizer as { id: string; email: string; full_name: string } | null;

                    // Format date and time for email
                    const eventDate = new Date(eventDetails.start_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    const eventTime = new Date(eventDetails.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });

                    const emailResult = await sendRSVPCancellationEmail({
                        to: userEmail,
                        userName,
                        userEmail,
                        eventTitle: eventDetails.title,
                        eventDescription: eventDetails.description || 'No description provided',
                        eventDate,
                        eventTime,
                        eventLocation: eventDetails.location,
                        eventAddress: eventDetails.address || eventDetails.location,
                        organizerName: organizerData?.full_name || 'Event Organizer',
                        organizerEmail: organizerData?.email || EMAIL_ADDRESSES.ORGANIZER,
                        rsvpId: updatedRsvp.id,
                        cancellationReason: updateData.notes || undefined,
                        eventSlug: eventDetails.slug
                    });

                    if (!emailResult.success) {
                        console.warn('Failed to send cancellation email:', emailResult.error);
                        // Don't fail the cancellation if email fails - just log it
                    } else {
                        console.log('Cancellation email sent successfully:', emailResult.messageId);
                    }
                }
            } catch (emailError) {
                console.error('Error sending cancellation email:', emailError);
                // Don't fail the cancellation if email fails
            }
        }

        // TODO: Remove from Google Calendar if cancelled

        const action = updateData.status === 'cancelled' ? 'cancelled' : 'updated'
        return NextResponse.json({
            message: `RSVP ${action} successfully`,
            rsvp: updatedRsvp
        })

    } catch (error) {
        console.error('Unexpected error in PATCH /api/rsvps/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/rsvps/[id] - Delete RSVP (hard delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        console.log('DELETE RSVP - User ID:', user.id, 'RSVP ID:', id);

        // Verify RSVP exists and user has permission
        const { data: existingRsvp, error: rsvpError } = await supabase
            .from('rsvps')
            .select(`
                *,
                events:event_id (
                    id,
                    title,
                    start_time
                )
            `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (rsvpError || !existingRsvp) {
            console.error('RSVP lookup error:', rsvpError);
            return NextResponse.json(
                { error: 'RSVP not found or access denied' },
                { status: 404 }
            )
        }

        // Check if deletion is allowed (calculate the 2-hour rule directly)
        const eventStartTime = new Date(existingRsvp.events.start_time);
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        
        if (existingRsvp.status !== 'confirmed' || eventStartTime <= twoHoursFromNow) {
            return NextResponse.json(
                { error: 'RSVP deletion is not allowed within 2 hours of the event' },
                { status: 400 }
            )
        }

        // Delete the RSVP
        const { error: deleteError } = await supabase
            .from('rsvps')
            .delete()
            .eq('id', id)

        if (deleteError) {
            console.error('Error deleting RSVP:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete RSVP' },
                { status: 500 }
            )
        }

        // TODO: Send cancellation confirmation email
        // TODO: Remove from Google Calendar

        return NextResponse.json({
            message: 'RSVP deleted successfully'
        })

    } catch (error) {
        console.error('Unexpected error in DELETE /api/rsvps/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 