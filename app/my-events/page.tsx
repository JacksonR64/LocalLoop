import { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UserDashboard from '@/components/dashboard/UserDashboard'

export const metadata: Metadata = {
    title: 'My Events | LocalLoop',
    description: 'Manage your event tickets, orders, and attendance',
}

export default async function MyEventsPage() {
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/auth/login?redirectTo=/my-events')
    }

    return <UserDashboard user={user} />
} 