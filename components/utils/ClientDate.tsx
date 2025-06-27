'use client'

import { useState, useEffect } from 'react'
import { formatDateTime, formatDate } from '@/lib/utils'

interface ClientDateTimeProps {
  date: Date | string
  format?: 'full' | 'date-only'
  className?: string
}

export function ClientDateTime({ date, format = 'full', className }: ClientDateTimeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return <span className={className}>Loading...</span>
  }

  const formattedDate = format === 'full' 
    ? formatDateTime(date)
    : formatDate(date)

  return <span className={className}>{formattedDate}</span>
}