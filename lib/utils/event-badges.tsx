import React from 'react'
import { getEventTimingBadge } from './event-timing'

export interface EventBadgeProps {
    event: {
        is_paid?: boolean
        featured?: boolean
        start_time: string
    }
    showPrice?: boolean
    priceInfo?: {
        hasPrice: boolean
        lowestPrice: number
    }
    isUpcoming?: boolean
}

/**
 * Get Free/Paid badge with consistent styling across the app
 */
export function getEventPriceBadge(
    isPaid: boolean, 
    isUpcoming: boolean = true,
    priceInfo?: { hasPrice: boolean; lowestPrice: number },
    variant: 'default' | 'full' = 'default'
): React.ReactElement | null {
    const isFullVariant = variant === 'full'
    const sizeClasses = isFullVariant 
        ? "text-sm px-3 py-1 font-medium" 
        : "text-xs px-2 py-1"
    
    if (!isPaid && isUpcoming) {
        return (
            <span 
                className={`bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-100 ${sizeClasses}`}
                aria-label="Free event"
                data-test-id="free-badge"
            >
                {isFullVariant ? 'Free Event' : 'Free'}
            </span>
        )
    }
    
    if (isPaid) {
        const displayText = priceInfo?.hasPrice 
            ? `$${priceInfo.lowestPrice}` 
            : (isFullVariant ? 'Paid Event' : 'Paid')
            
        return (
            <span 
                className={`bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-100 ${sizeClasses}`}
                aria-label={`Paid event${priceInfo?.hasPrice ? `, starting at $${priceInfo.lowestPrice}` : ''}`}
                data-test-id="paid-badge"
            >
                {displayText}
            </span>
        )
    }
    
    return null
}

/**
 * Get Featured badge with consistent styling
 */
export function getFeaturedBadge(isFeatured: boolean): React.ReactElement | null {
    if (!isFeatured) return null
    
    return (
        <span 
            className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium"
            aria-label="Featured event"
            data-test-id="featured-badge"
        >
            Featured
        </span>
    )
}

/**
 * Get all event badges in a consistent container
 */
export function EventBadges({ 
    event, 
    showPrice = true, 
    priceInfo,
    isUpcoming = true,
    className = "flex gap-2",
    variant = 'default'
}: EventBadgeProps & { className?: string; variant?: 'default' | 'full' }): React.ReactElement {
    return (
        <div className={className}>
            {getFeaturedBadge(event.featured || false)}
            {showPrice && getEventPriceBadge(event.is_paid || false, isUpcoming, priceInfo, variant)}
            {getEventTimingBadge(event.start_time)}
        </div>
    )
}

/**
 * Format price for display in badges
 */
export function formatPrice(price: number): string {
    return price.toFixed(2)
}