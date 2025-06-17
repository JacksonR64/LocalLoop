import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import StaffEventCreateClient from './StaffEventCreateClient'

export default async function StaffEventCreatePage() {
    const supabase = await createServerSupabaseClient()

    // Check authentication and role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/auth/login')
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, display_name, email')
        .eq('id', user.id)
        .single()

    if (userError || !userData || (userData.role !== 'organizer' && userData.role !== 'admin')) {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
                    <p className="mt-2 text-muted-foreground">Create and manage your event details</p>
                </div>
                <StaffEventCreateClient />
            </div>
        </div>
    )
} 