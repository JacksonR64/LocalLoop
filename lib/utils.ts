import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for proper Tailwind class merging
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format date to a readable string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format date and time to a readable string
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
    return formatDate(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Truncate text to a specified length
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length).trim() + '...';
}

/**
 * Get display description for event cards with consistent length
 * Prioritizes short_description, falls back to truncated description
 * @param description - Full description
 * @param shortDescription - Short description (optional)
 * @param maxLength - Maximum character length (default: 85)
 * @returns Consistent length description for card display
 */
export function getEventCardDescription(
    description?: string, 
    shortDescription?: string, 
    maxLength: number = 85
): string {
    // Prioritize short description if it exists
    if (shortDescription) {
        // If short description is too long, truncate it too
        return shortDescription.length > maxLength 
            ? truncateText(shortDescription, maxLength)
            : shortDescription;
    }
    
    // Fall back to truncated full description
    if (description) {
        return truncateText(description, maxLength);
    }
    
    return '';
}

/**
 * Convert price from cents to dollars
 * @param cents - Price in cents
 * @returns Formatted price string
 */
export function formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(cents / 100);
}

/**
 * Generate a slug from a string
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
} 