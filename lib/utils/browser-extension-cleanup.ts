'use client'

/**
 * Simple browser extension attribute cleanup for Next.js 15 + React 19
 * Prevents hydration mismatches caused by extension-injected attributes
 * 
 * Usage: Call this once in your root layout or main component
 */
export function cleanupBrowserExtensionAttributes() {
  if (typeof window === 'undefined') return

  // Remove common extension attributes that cause hydration mismatches
  const extensionAttributes = [
    'cz-shortcut-listen', // ColorZilla
    'fdprocessedid', // McAfee
    'data-lt-installed', // LanguageTool
    'grammarly-extension-installed', // Grammarly
    'data-adblock-key' // Ad blockers
  ]

  const cleanup = () => {
    extensionAttributes.forEach(attr => {
      document.querySelectorAll(`[${attr}]`).forEach(el => {
        el.removeAttribute(attr)
      })
    })
  }

  // Run cleanup on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanup)
  } else {
    cleanup()
  }

  // Run cleanup periodically to catch late injections
  setTimeout(cleanup, 100)
  setTimeout(cleanup, 500)
  setTimeout(cleanup, 1000)
}