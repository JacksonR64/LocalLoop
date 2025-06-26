'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { GlobalLoadingIndicator } from '@/components/ui/DelayedLoadingIndicator'

interface LoadingContextType {
  /** Start a loading operation with optional identifier */
  startLoading: (id?: string) => void
  /** Stop a loading operation with optional identifier */
  stopLoading: (id?: string) => void
  /** Check if any loading operation is active */
  isLoading: boolean
  /** Check if a specific loading operation is active */
  isLoadingId: (id: string) => boolean
  /** Wrap an async operation with loading state */
  withLoading: <T>(promise: Promise<T>, id?: string) => Promise<T>
}

const LoadingContext = createContext<LoadingContextType | null>(null)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: React.ReactNode
  /** Position of global loading indicator */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
  /** Delay before showing loading indicator */
  delay?: number
}

export function LoadingProvider({ 
  children, 
  position = 'top-right',
  delay = 1000 
}: LoadingProviderProps) {
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set())

  const startLoading = useCallback((id: string = 'default') => {
    setLoadingOperations(prev => new Set(prev).add(id))
  }, [])

  const stopLoading = useCallback((id: string = 'default') => {
    setLoadingOperations(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const isLoading = loadingOperations.size > 0

  const isLoadingId = useCallback((id: string) => {
    return loadingOperations.has(id)
  }, [loadingOperations])

  const withLoading = useCallback(async <T>(promise: Promise<T>, id: string = 'default'): Promise<T> => {
    startLoading(id)
    try {
      const result = await promise
      return result
    } finally {
      stopLoading(id)
    }
  }, [startLoading, stopLoading])

  const contextValue: LoadingContextType = {
    startLoading,
    stopLoading,
    isLoading,
    isLoadingId,
    withLoading
  }

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <GlobalLoadingIndicator 
        isLoading={isLoading} 
        position={position}
        delay={delay}
      />
    </LoadingContext.Provider>
  )
}