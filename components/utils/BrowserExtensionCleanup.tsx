'use client'

import { useEffect } from 'react'
import { cleanupBrowserExtensionAttributes } from '@/lib/utils/browser-extension-cleanup'

/**
 * Client component to clean up browser extension attributes
 * Prevents hydration mismatches in Next.js 15 + React 19
 */
export function BrowserExtensionCleanup() {
  useEffect(() => {
    cleanupBrowserExtensionAttributes()
  }, [])

  return null // This component doesn't render anything
}