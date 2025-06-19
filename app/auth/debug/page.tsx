import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function AuthDebugPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()

  const allCookies = cookieStore.getAll()
  const supabaseCookies = allCookies.filter(cookie => 
    cookie.name.includes('sb-') || cookie.name.includes('supabase')
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Information</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Server-side Session</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ session: !!session, user: !!user, error }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Session Details</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({
              sessionExists: !!session,
              userExists: !!user,
              userId: user?.id,
              userEmail: user?.email,
              sessionExpiry: session?.expires_at,
              accessTokenExists: !!session?.access_token,
              refreshTokenExists: !!session?.refresh_token,
              errorMessage: error?.message
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">All Cookies</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' })), null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Supabase Cookies</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(supabaseCookies.map(c => ({ 
              name: c.name, 
              hasValue: !!c.value,
              valueLength: c.value.length
            })), null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Clear Auth Action</h2>
          <form action="/api/auth/clear" method="POST">
            <button 
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear All Auth Cookies
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}