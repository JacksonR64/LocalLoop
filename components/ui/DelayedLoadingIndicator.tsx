'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DelayedLoadingIndicatorProps {
  /** Whether loading is active */
  isLoading: boolean
  /** Delay before showing indicator (ms) - default 1000ms */
  delay?: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom className */
  className?: string
  /** Loading text */
  text?: string
  /** Show as overlay over content */
  overlay?: boolean
  /** Custom icon */
  icon?: React.ReactNode
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8'
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
}

export function DelayedLoadingIndicator({
  isLoading,
  delay = 1000,
  size = 'md',
  className,
  text,
  overlay = false,
  icon
}: DelayedLoadingIndicatorProps) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isLoading) {
      // Show loading indicator after delay
      timeout = setTimeout(() => {
        setShowLoading(true)
      }, delay)
    } else {
      // Hide immediately when loading stops
      setShowLoading(false)
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [isLoading, delay])

  if (!showLoading) {
    return null
  }

  const content = (
    <div className={cn(
      'flex items-center justify-center gap-2',
      overlay && 'absolute inset-0 bg-background/80 backdrop-blur-sm z-50',
      className
    )}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon || <Loader2 className={cn('animate-spin', sizeClasses[size])} />}
        {text && (
          <span className={cn('font-medium', textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    </div>
  )

  return content
}

/**
 * Hook for managing delayed loading states with automatic cleanup
 */
export function useDelayedLoading(delay: number = 1000) {
  const [isLoading, setIsLoading] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isLoading) {
      timeout = setTimeout(() => {
        setShowLoading(true)
      }, delay)
    } else {
      setShowLoading(false)
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [isLoading, delay])

  return {
    isLoading,
    setIsLoading,
    showLoading,
    // Convenience method for async operations
    withLoading: async function<T>(promise: Promise<T>): Promise<T> {
      setIsLoading(true)
      try {
        const result = await promise
        return result
      } finally {
        setIsLoading(false)
      }
    }
  }
}

/**
 * Loading indicator that appears in a fixed position on screen
 */
export function GlobalLoadingIndicator({
  isLoading,
  delay = 1000,
  position = 'top-right'
}: {
  isLoading: boolean
  delay?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
}) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isLoading) {
      timeout = setTimeout(() => {
        setShowLoading(true)
      }, delay)
    } else {
      setShowLoading(false)
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [isLoading, delay])

  if (!showLoading) {
    return null
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4', 
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  }

  return (
    <div className={cn(
      'fixed z-50 pointer-events-none',
      positionClasses[position]
    )}>
      <div className="bg-background/90 backdrop-blur-md border border-border rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    </div>
  )
}