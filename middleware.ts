import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - API routes (handled separately)
         * - Next.js internals  
         * - Static files
         */
        '/((?!api|_next|favicon.ico|manifest.json).*)',
    ],
} 