import { NextRequest, NextResponse } from 'next/server'

// Performance tracking middleware
export function withPerformanceTracking(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const startTime = performance.now()
    const endpoint = req.url.split('?')[0] // Remove query params for cleaner metrics
    const method = req.method

    try {
      // Execute the handler
      const response = await handler(req)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Track successful API performance
      await trackAPIPerformance({
        endpoint,
        method,
        duration,
        status: response.status,
        success: response.status < 400,
        timestamp: Date.now(),
        userAgent: req.headers.get('user-agent') || 'unknown',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      })

      // Add performance headers to response
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`)
      response.headers.set('X-API-Version', '1.0')

      return response
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Track API errors
      await trackAPIPerformance({
        endpoint,
        method,
        duration,
        status: 500,
        success: false,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent: req.headers.get('user-agent') || 'unknown',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      })

      throw error
    }
  }
}

interface APIPerformanceData {
  endpoint: string
  method: string
  duration: number
  status: number
  success: boolean
  timestamp: number
  userAgent: string
  ip: string
  error?: string
}

async function trackAPIPerformance(data: APIPerformanceData) {
  try {
    // Skip tracking the analytics endpoint itself to prevent infinite loops
    if (data.endpoint.includes('/api/analytics/performance')) {
      return
    }

    // In production, you might want to batch these or use a queue
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 API Performance:', {
        endpoint: data.endpoint,
        method: data.method,
        duration: `${data.duration.toFixed(2)}ms`,
        status: data.status,
        success: data.success,
        ...(data.error && { error: data.error })
      })
    }

    // Send to performance collection endpoint
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'api_performance',
        endpoint: data.endpoint,
        method: data.method,
        duration: data.duration,
        status: data.status,
        success: data.success,
        timestamp: data.timestamp,
        url: data.endpoint,
        userAgent: data.userAgent,
        additional_data: {
          ip: data.ip,
          ...(data.error && { error: data.error })
        }
      })
    }).catch(error => {
      // Silently fail performance tracking to not impact API performance
      if (process.env.NODE_ENV === 'development') {
        console.warn('Performance tracking failed:', error)
      }
    })
  } catch (error) {
    // Silently fail - don't let performance tracking break the API
    if (process.env.NODE_ENV === 'development') {
      console.warn('Performance tracking error:', error)
    }
  }
}

// Simple performance decorator for individual functions
export function withFunctionPerformanceTracking<T extends (...args: unknown[]) => unknown>(
  fn: T,
  functionName: string
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now()

    try {
      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = performance.now() - startTime
            logFunctionPerformance(functionName, duration, true)
            return value
          })
          .catch((error) => {
            const duration = performance.now() - startTime
            logFunctionPerformance(functionName, duration, false, error instanceof Error ? error : undefined)
            throw error
          })
      } else {
        // Handle sync functions
        const duration = performance.now() - startTime
        logFunctionPerformance(functionName, duration, true)
        return result
      }
    } catch (error) {
      const duration = performance.now() - startTime
      logFunctionPerformance(functionName, duration, false, error instanceof Error ? error : undefined)
      throw error
    }
  }) as T
}

function logFunctionPerformance(functionName: string, duration: number, success: boolean, error?: Error) {
  if (process.env.NODE_ENV === 'development' && duration > 100) { // Only log slow functions
    console.log(`🔧 Function Performance: ${functionName} took ${duration.toFixed(2)}ms`,
      success ? '✅' : '❌', error ? `Error: ${error.message}` : '')
  }
}

export function performanceMiddleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security and performance headers
  const headers = {
    // Performance headers
    'X-DNS-Prefetch-Control': 'on',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',

    // Cache control for static assets
    'Cache-Control': request.nextUrl.pathname.startsWith('/_next/static/')
      ? 'public, max-age=31536000, immutable'
      : request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|avif)$/)
        ? 'public, max-age=86400'
        : 'public, max-age=0, must-revalidate',

    // Compression hint
    'Vary': 'Accept-Encoding',

    // Resource hints for critical resources
    'Link': '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
  }

  // Apply headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add timing headers for monitoring
  const startTime = Date.now()
  response.headers.set('X-Response-Time-Start', startTime.toString())

  return response
}

// Helper to add timing end header (to be used in API routes)
export function addTimingHeader(response: NextResponse, startTime: number) {
  const endTime = Date.now()
  const duration = endTime - startTime
  response.headers.set('X-Response-Time', `${duration}ms`)
  response.headers.set('Server-Timing', `app;dur=${duration}`)
  return response
} 