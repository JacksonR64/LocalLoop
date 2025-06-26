import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          // Simplified fix from GitHub issue #36: just use response.cookies.set with original options
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  let isAuthValid = false
  
  try {
    // Check both session and user for comprehensive auth validation
    const [
      { data: { session }, error: sessionError },
      { data: { user: authUser }, error: userError }
    ] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser()
    ])
    
    // Authentication is valid only if:
    // 1. No errors occurred
    // 2. Session exists and is not expired
    // 3. User exists
    const hasValidSession = !!(session && !sessionError && session.expires_at && 
      new Date(session.expires_at * 1000) > new Date())
    const hasValidUser = !!(authUser && !userError)
    
    isAuthValid = hasValidSession && hasValidUser
    user = isAuthValid ? authUser : null
    
    // If there are auth errors or invalid session, clear stale cookies
    if (!isAuthValid && (sessionError || userError)) {
      const cookiesToClear = request.cookies.getAll().filter(cookie => 
        cookie.name.includes('sb-') || cookie.name.includes('supabase')
      )
      
      if (cookiesToClear.length > 0) {
        supabaseResponse = NextResponse.next({ request })
        cookiesToClear.forEach(cookie => {
          supabaseResponse.cookies.set(cookie.name, '', {
            expires: new Date(0),
            path: '/',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          })
        })
      }
    }
  } catch (error) {
    console.error('Middleware auth exception:', error)
    user = null
    isAuthValid = false
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Auth routes - handle stale authentication state
  const authRoutes = ['/auth/login', '/auth/signup']
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  if (isAuthRoute && user) {
    // Check if this is a forced logout request (user manually navigated to login)
    const forceLogout = request.nextUrl.searchParams.get('force_logout')
    const isManualNavigation = !request.headers.get('referer')?.includes('/auth/') 
    
    // If user manually navigates to login page, force clear their session
    // This handles cases where cookies are stale but middleware thinks user is authenticated
    if (forceLogout === 'true' || isManualNavigation) {
      // Clear all Supabase auth cookies
      const authCookies = request.cookies.getAll().filter(cookie => 
        cookie.name.includes('sb-') || cookie.name.includes('supabase')
      )
      
      const response = NextResponse.next({ request })
      authCookies.forEach(cookie => {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
      })
      
      // Allow access to login page with cleared cookies
      return response
    }
    
    // Normal redirect for valid authenticated users
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so: NextResponse.next({ request })
  // 2. Copy over the cookies, like so: response.cookies.setAll(supabaseResponse.cookies.getAll())

  return supabaseResponse
}