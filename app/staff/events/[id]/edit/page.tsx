import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StaffEventEditClient from './StaffEventEditClient'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createServerSupabaseClient()
    const { id: eventId } = await params

    // Get the current user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Get user details including role
    const { data: userDetails } = await supabase
        .from('users')
        .select('id, email, display_name, role')
        .eq('id', user.id)
        .single()

    // Check if user has organizer or admin role
    if (!userDetails || !['organizer', 'admin'].includes(userDetails.role)) {
        redirect('/auth/login?error=insufficient_permissions')
    }

    // Get the event to edit
    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

    if (error || !event) {
        redirect('/staff?error=event_not_found')
    }

    // Check if user can edit this event (admins can edit any event, organizers can only edit their own)
    if (userDetails.role === 'organizer' && event.organizer_id !== user.id) {
        redirect('/staff?error=insufficient_permissions')
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Edit Event</h1>
                    <p className="mt-2 text-muted-foreground">Editing: {event.title}</p>
                </div>
                <StaffEventEditClient eventId={eventId} />
            </div>
        </div>
    )
} 