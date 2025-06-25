// Dynamic import for web-vitals to prevent server-side bundling issues
// import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

// Types for performance metrics
interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
}

// Removed unused interfaces - they were defined but never used

// Performance metric thresholds based on Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (replaces FID)
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
}

// Initialize Core Web Vitals tracking
export async function initWebVitals() {
  if (typeof window === 'undefined') return

  try {
    // Dynamic import to prevent server-side bundling
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals')

    // Track Largest Contentful Paint
    onLCP((metric) => {
      sendMetricToAPI({
        name: 'LCP',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    })

    // Track Interaction to Next Paint (replaces First Input Delay)
    onINP((metric) => {
      sendMetricToAPI({
        name: 'INP',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    })

    // Track Cumulative Layout Shift
    onCLS((metric) => {
      sendMetricToAPI({
        name: 'CLS',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    })

    // Track First Contentful Paint
    onFCP((metric) => {
      sendMetricToAPI({
        name: 'FCP',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    })

    // Track Time to First Byte
    onTTFB((metric) => {
      sendMetricToAPI({
        name: 'TTFB',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to initialize web vitals:', error)
    }
  }
}

// Send metric data to API
async function sendMetricToAPI(metric: PerformanceMetric) {
  try {
    // Validate metric data before sending
    if (!metric || typeof metric.value !== 'number' || !metric.name || !metric.timestamp) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid metric data, skipping send:', metric)
      }
      return
    }

    const payload = {
      type: 'web_vital',
      metric_type: 'web_vital',
      metric_name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: metric.url,
      user_agent: metric.userAgent,
      timestamp: metric.timestamp,
      additional_data: {
        navigationType: (window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type || 'unknown',
        connectionType: ('connection' in navigator ? (navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType : undefined) || 'unknown'
      }
    }

    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    // Silently fail - don't let analytics break the user experience
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to send performance metric:', error)
    }
  }
}

// Track page load performance
export function trackPageLoad(pageName: string) {
  if (typeof window === 'undefined') return

  // Use a more robust approach to ensure timing data is complete
  let retryCount = 0
  const maxRetries = 10 // Maximum 1 second of retries (10 * 100ms)

  const captureMetrics = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (navigation && navigation.loadEventEnd > 0 && navigation.domContentLoadedEventEnd > 0) {

      const metrics = {
        domContentLoaded: Math.max(0, navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.max(0, navigation.loadEventEnd - navigation.loadEventStart),
        totalLoadTime: Math.max(0, navigation.loadEventEnd - navigation.fetchStart),
        dnsLookup: Math.max(0, navigation.domainLookupEnd - navigation.domainLookupStart),
        tcpConnect: Math.max(0, navigation.connectEnd - navigation.connectStart),
        serverResponse: Math.max(0, navigation.responseEnd - navigation.requestStart),
        domParsing: Math.max(0, navigation.domComplete - navigation.responseEnd)
      }

      // Validate metrics before sending - check all key metrics are positive and reasonable
      const isValidMetrics = typeof metrics.totalLoadTime === 'number' && 
                           !isNaN(metrics.totalLoadTime) && 
                           metrics.totalLoadTime >= 0 &&
                           metrics.loadComplete >= 0 &&
                           metrics.domContentLoaded >= 0 &&
                           // Additional validation for reasonable timing values
                           metrics.totalLoadTime < 300000 && // Max 5 minutes
                           metrics.serverResponse >= 0 &&
                           metrics.domParsing >= 0 &&
                           // Ensure navigation timing events occurred in logical order
                           navigation.loadEventEnd > 0 &&
                           navigation.domContentLoadedEventEnd > 0
      
      if (isValidMetrics) {
        // Send page load metrics
        fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'page_load',
            metric_type: 'page_load',
            metric_name: pageName,
            value: metrics.totalLoadTime,
            url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: Date.now(),
            additional_data: {
              ...metrics,
              navigationType: navigation.type,
              transferSize: navigation.transferSize,
              encodedBodySize: navigation.encodedBodySize,
              decodedBodySize: navigation.decodedBodySize
            }
          })
        }).catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to send page load metric:', error)
          }
        })
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid page load metrics, skipping send:', metrics)
      }
    } else if (retryCount < maxRetries) {
      // Timing data not ready yet, schedule a retry
      retryCount++
      setTimeout(captureMetrics, 100)
    }
    // If max retries reached, silently give up (no warnings)
  }

  // Try immediately if page is already loaded, otherwise wait for load event
  if (document.readyState === 'complete') {
    // Page is already loaded, wait a bit for timing data to populate
    setTimeout(captureMetrics, 50)
  } else {
    // Wait for load event, then try to capture metrics
    window.addEventListener('load', () => {
      setTimeout(captureMetrics, 50)
    })
  }
}

// Track user interactions
export function trackUserInteraction(action: string, element: string, component?: string) {
  if (typeof window === 'undefined') return

  const startTime = performance.now()

  // Use requestIdleCallback to measure interaction delay
  requestIdleCallback(() => {
    const duration = performance.now() - startTime

    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'user_interaction',
        metric_type: 'user_interaction',
        metric_name: action,
        value: duration,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: Date.now(),
        additional_data: {
          element,
          component,
          action
        }
      })
    }).catch(error => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to send interaction metric:', error)
      }
    })
  })
}

// Track API performance (for client-side API calls)
export function trackAPICall(endpoint: string, method: string = 'GET') {
  const startTime = performance.now()

  return {
    complete: (status: number) => {
      const duration = performance.now() - startTime

      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client_api',
          metric_type: 'api_performance',
          metric_name: endpoint,
          value: duration,
          url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: Date.now(),
          additional_data: {
            endpoint,
            method,
            status,
            success: status < 400
          }
        })
      }).catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to send API performance metric:', error)
        }
      })
    }
  }
}

// Get performance rating based on value and thresholds
export function getPerformanceRating(metricName: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// Performance utilities for debugging
export const performanceUtils = {
  // Get current page performance metrics
  getCurrentMetrics: () => {
    if (typeof window === 'undefined') return null

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!navigation) return null

    return {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnect: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.requestStart,
      domParsing: navigation.domComplete - navigation.responseEnd,
      totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      transferSize: navigation.transferSize,
      resources: performance.getEntriesByType('resource').length
    }
  },

  // Log current performance state
  logCurrentState: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Current Performance Metrics:', performanceUtils.getCurrentMetrics())
    }
  }
} 