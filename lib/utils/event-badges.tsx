import React from 'react'

export interface EventBadgeProps {
    event: {
        is_paid?: boolean
        start_time: string
    }
    priceInfo?: {
        hasPrice: boolean
        lowestPrice: number
    }
    isUpcoming?: boolean
}

/**
 * Clean, consistent badge styling with distinct colors and normal font weight
 */
const getBadgeClasses = () => "px-2 py-1 rounded-full text-xs font-normal"

/**
 * Get timing status of an event
 */
function getEventTiming(startTime: string) {
    const eventDate = new Date(startTime)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
    
    const oneDayAfterEvent = new Date(eventDate)
    oneDayAfterEvent.setDate(eventDate.getDate() + 1)
    
    if (now >= oneDayAfterEvent) {
        return 'past'
    }
    
    if (eventDay.getTime() === today.getTime()) {
        return 'today'
    }
    
    if (eventDay.getTime() === tomorrow.getTime()) {
        return 'tomorrow'
    }
    
    const daysDifference = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDifference <= 7 && daysDifference >= 2) {
        return 'soon'
    }
    
    return 'upcoming'
}

/**
 * Get color classes for timing badges
 */
function getTimingColors(status: string): string {
    switch (status) {
        case 'today':
            return 'bg-red-50 text-red-700'
        case 'tomorrow':
            return 'bg-emerald-50 text-emerald-700'
        case 'soon':
            return 'bg-yellow-50 text-yellow-700'
        case 'past':
            return 'bg-gray-50 text-gray-600'
        default:
            return 'bg-blue-50 text-blue-700'
    }
}

/**
 * Get label for timing status
 */
function getTimingLabel(status: string): string {
    switch (status) {
        case 'today':
            return 'Today'
        case 'tomorrow':
            return 'Tomorrow'
        case 'soon':
            return 'Soon'
        case 'past':
            return 'Past'
        default:
            return 'Upcoming'
    }
}

/**
 * Render all event badges with consistent styling and distinct colors
 */
export function EventBadges({ 
    event, 
    priceInfo,
    isUpcoming = true,
    className = "flex gap-2"
}: EventBadgeProps & { className?: string }): React.ReactElement {
    const timingStatus = getEventTiming(event.start_time)
    const timingColors = getTimingColors(timingStatus)
    const timingLabel = getTimingLabel(timingStatus)
    
    const priceText = priceInfo?.hasPrice ? `$${priceInfo.lowestPrice}` : 'Paid'
    const priceAriaLabel = priceInfo?.hasPrice 
        ? `Paid event, starting at $${priceInfo.lowestPrice}`
        : 'Paid event'
    
    return (
        <div className={className}>
            {/* Price Badge */}
            {event.is_paid && (
                <span 
                    className={`${getBadgeClasses()} bg-purple-50 text-purple-700`}
                    aria-label={priceAriaLabel}
                >
                    {priceText}
                </span>
            )}
            {!event.is_paid && isUpcoming && (
                <span 
                    className={`${getBadgeClasses()} bg-green-50 text-green-700`}
                    aria-label="Free event"
                >
                    Free
                </span>
            )}
            
            {/* Timing Badge */}
            <span 
                className={`${getBadgeClasses()} ${timingColors}`}
                aria-label={`Event timing: ${timingLabel}`}
            >
                {timingLabel}
            </span>
        </div>
    )
}