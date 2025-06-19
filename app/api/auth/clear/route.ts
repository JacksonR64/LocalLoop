import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
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

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Manually clear all Supabase-related cookies
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('sb-') || cookie.name.includes('supabase')
    )

    // Create response that clears cookies
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    
    // Clear each Supabase cookie explicitly
    supabaseCookies.forEach(cookie => {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        domain: undefined,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    // Also clear common Supabase cookie patterns
    const commonCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.auth.token'
    ]

    commonCookieNames.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        domain: undefined,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    return response
  } catch (error) {
    console.error('Error clearing auth:', error)
    return NextResponse.json({ error: 'Failed to clear auth' }, { status: 500 })
  }
}