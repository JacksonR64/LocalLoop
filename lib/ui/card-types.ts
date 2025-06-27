import { LucideIcon } from 'lucide-react';
import { 
    FileText, 
    MapPin, 
    CalendarPlus, 
    Info, 
    Receipt, 
    User, 
    CreditCard, 
    ShoppingCart, 
    CalendarDays 
} from 'lucide-react';

/**
 * Configuration interface for card types
 * Defines the structure for each card type's metadata
 */
export interface CardTypeConfig {
    /** The Lucide icon component to display */
    icon: LucideIcon;
    /** The display title for the card */
    title: string;
    /** Optional description for accessibility */
    description?: string;
    /** Test ID for testing purposes */
    testId?: string;
    /** Optional default props for the card */
    defaultProps?: Record<string, any>;
}

/**
 * Central registry of all card types used throughout the application
 * This is the single source of truth for card configurations
 */
export const CARD_TYPE_CONFIGS = {
    // Event Detail Page Cards
    'about-event': {
        icon: FileText,
        title: 'About This Event',
        description: 'Detailed information about the event',
        testId: 'description-title',
    },
    'location': {
        icon: MapPin,
        title: 'Location',
        description: 'Event location and map',
        testId: 'location-title',
    },
    'add-calendar': {
        icon: CalendarPlus,
        title: 'Add to Calendar',
        description: 'Calendar integration options',
        testId: 'calendar-title',
    },
    'event-details': {
        icon: Info,
        title: 'Event Details',
        description: 'Event statistics and information',
        testId: 'event-stats-title',
    },
    
    // Checkout Flow Cards
    'order-summary': {
        icon: Receipt,
        title: 'Order Summary',
        description: 'Order details and pricing',
        testId: 'order-summary-title',
    },
    'customer-info': {
        icon: User,
        title: 'Customer Information',
        description: 'Customer contact details',
        testId: 'customer-info-title',
    },
    'payment-info': {
        icon: CreditCard,
        title: 'Payment Information',
        description: 'Payment method and billing',
        testId: 'payment-info-title',
    },
    
    // Ticket and RSVP Cards
    'get-tickets': {
        icon: ShoppingCart,
        title: 'Get Your Tickets',
        description: 'Ticket selection and purchase',
        testId: 'ticket-section-title',
    },
    'event-rsvp': {
        icon: CalendarDays,
        title: 'Event RSVP',
        description: 'RSVP for free events',
        testId: 'rsvp-title',
    },
} as const;

/**
 * Type-safe keys for card type configurations
 */
export type CardType = keyof typeof CARD_TYPE_CONFIGS;

/**
 * Helper function to get card configuration with type safety
 * Provides fallback for unknown card types
 */
export function getCardConfig(type: string): CardTypeConfig {
    const config = CARD_TYPE_CONFIGS[type as CardType];
    
    if (!config) {
        console.warn(`Unknown card type: ${type}. Using fallback configuration.`);
        return {
            icon: Info,
            title: 'Unknown Card',
            description: 'Unknown card type',
            testId: 'unknown-card',
        };
    }
    
    return config;
}

/**
 * Helper function to check if a card type exists
 */
export function isValidCardType(type: string): type is CardType {
    return type in CARD_TYPE_CONFIGS;
}

/**
 * Get all available card types
 */
export function getAvailableCardTypes(): CardType[] {
    return Object.keys(CARD_TYPE_CONFIGS) as CardType[];
}