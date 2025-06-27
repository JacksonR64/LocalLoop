'use client'

import { useSyncExternalStore } from 'react'
import { formatDateTime, formatDate } from '@/lib/utils'

interface ClientDateTimeProps {
  date: Date | string
  format?: 'full' | 'date-only' | 'short-date' | 'time-only' | 'month-short'
  options?: Intl.DateTimeFormatOptions
  className?: string
}

export function ClientDateTime({ date, format = 'full', options, className }: ClientDateTimeProps) {
  const formattedDate = useSyncExternalStore(
    () => () => {}, // No subscription needed for static dates
    () => {
      // Client snapshot: format the date
      if (options) {
        return formatDate(date, options)
      }
      
      switch (format) {
        case 'full':
          return formatDateTime(date)
        case 'date-only':
          return formatDate(date)
        case 'short-date':
          return formatDate(date, { month: 'short', day: 'numeric' })
        case 'time-only':
          return formatDate(date, { hour: 'numeric', minute: '2-digit', hour12: true })
        case 'month-short':
          return formatDate(date, { month: 'short' })
        default:
          return formatDateTime(date)
      }
    },
    () => {
      // Server snapshot: return consistent placeholder
      const dateObj = typeof date === 'string' ? new Date(date) : date
      const isoStr = dateObj.toISOString()
      const dateStr = isoStr.split('T')[0] // YYYY-MM-DD
      
      switch (format) {
        case 'full':
          return `${dateStr} 12:00 PM`
        case 'date-only':
          return dateStr
        case 'short-date':
          return 'Jan 1'
        case 'time-only':
          return '12:00 PM'
        case 'month-short':
          return 'Jan'
        default:
          return `${dateStr} 12:00 PM`
      }
    }
  )

  return <span className={className}>{formattedDate}</span>
}