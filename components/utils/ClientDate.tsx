'use client'

import { useSyncExternalStore } from 'react'
import { formatDateTime, formatDate } from '@/lib/utils'

interface ClientDateTimeProps {
  date: Date | string
  format?: 'full' | 'date-only'
  className?: string
}

export function ClientDateTime({ date, format = 'full', className }: ClientDateTimeProps) {
  const formattedDate = useSyncExternalStore(
    () => () => {}, // No subscription needed for static dates
    () => {
      // Client snapshot: format the date
      return format === 'full' ? formatDateTime(date) : formatDate(date)
    },
    () => {
      // Server snapshot: return consistent placeholder
      const dateObj = typeof date === 'string' ? new Date(date) : date
      const timeStr = dateObj.toISOString().split('T')[0] // YYYY-MM-DD format for consistency
      return format === 'full' ? `${timeStr} 12:00 PM` : timeStr
    }
  )

  return <span className={className}>{formattedDate}</span>
}