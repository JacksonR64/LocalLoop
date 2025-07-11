import React from 'react'
import { Badge } from '@/components/ui/badge'

/**
 * Determines if an event is upcoming based on start time and 1-day grace period
 * Events are considered "past" only 1 day after the event date
 * 
 * @param startTime - Event start time
 * @param currentTime - Optional current time for testing/SSR consistency
 */
export function isEventUpcoming(startTime: string, currentTime?: Date): boolean {
    const eventDate = new Date(startTime)
    const oneDayAfterEvent = new Date(eventDate)
    oneDayAfterEvent.setDate(eventDate.getDate() + 1)
    const now = currentTime || new Date()
    return now < oneDayAfterEvent
}

/**
 * Gets the appropriate timing badge for an event
 * Returns Today, Tomorrow, Upcoming, or Past Event based on event timing
 * 
 * @param startTime - Event start time
 * @param currentTime - Optional current time for testing/SSR consistency
 */
export function getEventTimingBadge(startTime: string, currentTime?: Date): React.ReactElement {
    const eventDate = new Date(startTime)
    const now = currentTime || new Date()
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
            <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                Today
            </Badge>
        )
    }
    
    // Check if event is tomorrow
    if (eventDay.getTime() === tomorrow.getTime()) {
        return (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Tomorrow
            </Badge>
        )
    }
    
    // Check if event is soon (within 7 days, excluding today and tomorrow)
    const daysDifference = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isSoon = daysDifference <= 7 && daysDifference >= 2
    
    if (isSoon) {
        return (
            <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Soon
            </Badge>
        )
    }
    
    // Default to upcoming
    return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
            Upcoming
        </Badge>
    )
}

/**
 * Gets event timing information for filtering and sorting
 * 
 * @param startTime - Event start time
 * @param currentTime - Optional current time for testing/SSR consistency  
 */
export function getEventTimingInfo(startTime: string, currentTime?: Date) {
    const eventDate = new Date(startTime)
    const now = currentTime || new Date()
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