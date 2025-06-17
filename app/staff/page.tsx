import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StaffDashboard from '@/components/dashboard/StaffDashboard'

export default async function StaffPage() {
    const supabase = await createServerSupabaseClient()

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
    if (!userDetails || (userDetails.role !== 'organizer' && userDetails.role !== 'admin')) {
        redirect('/')
    }

    return (
        <div className="container mx-auto">
            <StaffDashboard user={userDetails} />
        </div>
    )
}

export const metadata = {
    title: 'Staff Dashboard - LocalLoop',
    description: 'Manage your events, attendees, and analytics',
} 