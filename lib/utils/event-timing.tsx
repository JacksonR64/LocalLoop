import React from 'react'
import { Badge } from '@/components/ui/badge'

/**
 * Determines if an event is upcoming based on start time and 1-day grace period
 * Events are considered "past" only 1 day after the event date
 */
export function isEventUpcoming(startTime: string): boolean {
    const eventDate = new Date(startTime)
    const oneDayAfterEvent = new Date(eventDate)
    oneDayAfterEvent.setDate(eventDate.getDate() + 1)
    return new Date() < oneDayAfterEvent
}

/**
 * Gets the appropriate timing badge for an event
 * Returns Today, Tomorrow, Upcoming, or Past Event based on event timing
 */
export function getEventTimingBadge(startTime: string): React.ReactElement {
    const eventDate = new Date(startTime)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
    
    const oneDayAfterEvent = new Date(eventDate)
    oneDayAfterEvent.setDate(eventDate.getDate() + 1)
    
    // Check if event is past (1 day after event date)
    if (now >= oneDayAfterEvent) {
        return (
            <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">
                Past Event
            </Badge>
        )
    }
    
    // Check if event is today
    if (eventDay.getTime() === today.getTime()) {
        return (
            <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
                Today
            </Badge>
        )
    }
    
    // Check if event is tomorrow
    if (eventDay.getTime() === tomorrow.getTime()) {
        return (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-700">
                Tomorrow
        </Badge>
        )
    }
    
    // Default to upcoming
    return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
            Upcoming
        </Badge>
    )
}

/**
 * Gets event timing information for filtering and sorting
 */
export function getEventTimingInfo(startTime: string) {
    const eventDate = new Date(startTime)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
    
    const oneDayAfterEvent = new Date(eventDate)
    oneDayAfterEvent.setDate(eventDate.getDate() + 1)
    
    const isUpcoming = now < oneDayAfterEvent
    const isToday = eventDay.getTime() === today.getTime()
    const isTomorrow = eventDay.getTime() === tomorrow.getTime()
    const isPast = now >= oneDayAfterEvent
    
    // Calculate days difference for "soon" logic
    const daysDifference = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isSoon = isUpcoming && daysDifference <= 7 && daysDifference >= 0 && !isToday && !isTomorrow
    
    return {
        isUpcoming,
        isToday,
        isTomorrow,
        isPast,
        isSoon,
        daysDifference
    }
}

/**
 * Formats date and time for display
 */
export function formatEventDateTime(dateString: string, includeTime = false) {
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })

    if (includeTime) {
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24-hour format
        })
        return `${dateStr} at ${timeStr}`
    }

    return dateStr
}