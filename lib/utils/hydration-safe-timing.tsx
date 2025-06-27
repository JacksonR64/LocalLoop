'use client'

import { useSyncExternalStore } from 'react'
import { getEventTimingInfo } from './event-timing'

/**
 * Browser extension attribute cleaner for Next.js 15 + React 19
 * Prevents hydration mismatches caused by extension-injected attributes
 */
function cleanBrowserExtensionAttributes() {
  if (typeof window === 'undefined') return

  // Remove common extension attributes that cause hydration mismatches
  const extensionAttributes = [
    'cz-shortcut-listen', // ColorZilla
    'fdprocessedid', // McAfee
    'data-lt-installed', // LanguageTool
    'grammarly-extension-installed', // Grammarly
    'data-adblock-key' // Ad blockers
  ]

  const observer = new MutationObserver(() => {
    extensionAttributes.forEach(attr => {
      document.querySelectorAll(`[${attr}]`).forEach(el => {
        el.removeAttribute(attr)
      })
    })
  })

  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: extensionAttributes
  })

  // Initial cleanup
  extensionAttributes.forEach(attr => {
    document.querySelectorAll(`[${attr}]`).forEach(el => {
      el.removeAttribute(attr)
    })
  })

  return () => observer.disconnect()
}

/**
 * Hydration-safe event timing hook using useSyncExternalStore
 * Prevents SSR/client mismatches for timing calculations
 */
export function useEventTiming(startTime: string) {
  const subscribe = (callback: () => void) => {
    // Clean extension attributes on mount
    const cleanup = cleanBrowserExtensionAttributes()
    
    // Update timing every minute to keep "Today"/"Tomorrow" accurate
    const interval = setInterval(callback, 60000)
    
    return () => {
      clearInterval(interval)
      cleanup?.()
    }
  }

  const getSnapshot = () => {
    if (typeof window === 'undefined') {
      // SSR: Return consistent default state
      return {
        isUpcoming: true,
        isToday: false,
        isTomorrow: false,
        isPast: false,
        isSoon: false,
        daysDifference: 1
      }
    }
    
    // Client: Calculate actual timing
    return getEventTimingInfo(startTime)
  }

  const getServerSnapshot = () => {
    // Always return consistent server state
    return {
      isUpcoming: true,
      isToday: false,
      isTomorrow: false,
      isPast: false,
      isSoon: false,
      daysDifference: 1
    }
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}