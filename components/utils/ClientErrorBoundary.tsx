'use client'

import React from 'react'

interface ClientErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// Default fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => {
  // Only show error in development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-medium">Component Error</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        <button 
          onClick={resetError}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs"
        >
          Retry
        </button>
      </div>
    )
  }
  
  // In production, silently render nothing to avoid layout breaks
  return null
}

export class ClientErrorBoundary extends React.Component<ClientErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ClientErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check for known React/Radix UI errors that we can safely ignore
    const ignorableErrors = [
      'Minified React error #418', // Focus management issues
      'Minified React error #419', // Hydration issues
      'roving-focus-group',        // Radix roving focus
      'focus-scope',               // Radix focus scope
    ]
    
    const shouldIgnore = ignorableErrors.some(pattern => 
      error.message?.includes(pattern) || error.stack?.includes(pattern)
    )
    
    if (shouldIgnore && process.env.NODE_ENV === 'production') {
      // In production, silently ignore these errors
      return { hasError: false, error: null }
    }
    
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging but don't crash the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('ClientErrorBoundary caught error:', error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}