import type {
    TicketType,
    TicketAvailability,
    PriceCalculation,
    FormatPriceFunction,
    ConvertToStripeAmountFunction,
    CalculateStripeFeeFunction
} from '@/lib/types/ticket';

/**
 * Format price from cents to display format
 * @param amountInCents - Amount in cents
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted price string
 */
export const formatPrice: FormatPriceFunction = (amountInCents: number, currency = 'USD'): string => {
    // Handle invalid values - default to 0 for calculations
    if (amountInCents == null || isNaN(amountInCents)) {
        amountInCents = 0;
    }

    const amount = amountInCents / 100;

    if (amountInCents === 0) {
        return 'Free';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
};

/**
 * Convert dollar amount to cents for Stripe
 * @param dollarAmount - Amount in dollars
 * @returns Amount in cents
 */
export const convertToStripeAmount: ConvertToStripeAmountFunction = (dollarAmount: number): number => {
    return Math.round(dollarAmount * 100);
};

/**
 * Convert cents to dollars
 * @param centsAmount - Amount in cents
 * @returns Amount in dollars
 */
export const convertToDollars = (centsAmount: number): number => {
    return centsAmount / 100;
};

/**
 * Calculate Stripe processing fee
 * Stripe charges 2.9% + $0.30 per transaction for most cards
 * @param amount - Amount in cents
 * @returns Price calculation breakdown
 */
export const calculateStripeFee: CalculateStripeFeeFunction = (amount: number): PriceCalculation => {
    const stripePercentageFee = Math.round(amount * 0.029); // 2.9%
    const stripeFixedFee = 30; // $0.30 in cents
    const totalStripeFee = stripePercentageFee + stripeFixedFee;

    // No additional application fee - just pass through actual Stripe costs
    const applicationFee = 0;

    const total = amount + totalStripeFee;

    return {
        subtotal: amount,
        stripe_fee: totalStripeFee,
        application_fee: applicationFee,
        total: total,
        currency: 'USD'
    };
};

/**
 * Calculate the total customer pays (including fees)
 * @param ticketPrice - Base ticket price in cents
 * @returns Total amount customer pays in cents
 */
export const calculateCustomerTotal = (ticketPrice: number): number => {
    const calculation = calculateStripeFee(ticketPrice);
    return calculation.total;
};

/**
 * Check if ticket type is available for purchase
 * @param ticketType - Ticket type to check
 * @param soldCount - Number of tickets already sold
 * @returns Availability information
 */
export const checkTicketAvailability = (
    ticketType: TicketType,
    soldCount: number = 0
): TicketAvailability => {
    const now = new Date();

    // Check sale period
    let saleStatus: 'not_started' | 'active' | 'ended' = 'active';

    if (ticketType.sale_start) {
        const saleStart = new Date(ticketType.sale_start);
        if (now < saleStart) {
            saleStatus = 'not_started';
        }
    }

    if (ticketType.sale_end) {
        const saleEnd = new Date(ticketType.sale_end);
        if (now > saleEnd) {
            saleStatus = 'ended';
        }
    }

    // Check capacity
    const totalCapacity = ticketType.capacity;
    const availableCount = totalCapacity ? Math.max(0, totalCapacity - soldCount) : null;
    const isAvailable = saleStatus === 'active' && (availableCount === null || availableCount > 0);

    return {
        ticket_type_id: ticketType.id,
        total_capacity: totalCapacity,
        sold_count: soldCount,
        available_count: availableCount,
        is_available: isAvailable,
        sale_status: saleStatus,
        sale_start: ticketType.sale_start,
        sale_end: ticketType.sale_end
    };
};

/**
 * Format ticket availability status
 * @param availability - Ticket availability data
 * @returns Human-readable status string
 */
export const formatAvailabilityStatus = (availability: TicketAvailability): string => {
    if (availability.sale_status === 'not_started') {
        return `Sales start ${new Date(availability.sale_start!).toLocaleDateString()}`;
    }

    if (availability.sale_status === 'ended') {
        return 'Sales ended';
    }

    if (!availability.is_available) {
        return 'Sold out';
    }

    if (availability.total_capacity === null) {
        return 'Available';
    }

    return `${availability.available_count} of ${availability.total_capacity} available`;
};

/**
 * Validate ticket price
 * @param price - Price in cents
 * @returns Validation result
 */
export const validateTicketPrice = (price: number): { isValid: boolean; error?: string } => {
    if (price < 0) {
        return { isValid: false, error: 'Price cannot be negative' };
    }

    if (price > 0 && price < 50) {
        return { isValid: false, error: 'Minimum price is $0.50 for paid tickets' };
    }

    // Stripe has a maximum charge amount
    if (price > 9999999) { // $99,999.99
        return { isValid: false, error: 'Maximum price is $99,999.99' };
    }

    return { isValid: true };
};

/**
 * Calculate refund amount after Stripe fees
 * @param originalAmount - Original charge amount in cents
 * @param refundType - Type of refund ('full_cancellation' or 'customer_request')
 * @returns Refund calculation breakdown
 */
export const calculateRefundAmount = (originalAmount: number, refundType: 'full_cancellation' | 'customer_request' = 'customer_request'): {
    originalAmount: number;
    stripeFee: number;
    netRefund: number;
} => {
    // For event cancellations, full refund with no fees
    if (refundType === 'full_cancellation') {
        return {
            originalAmount,
            stripeFee: 0,
            netRefund: originalAmount
        };
    }

    // For customer requests, Stripe keeps the fixed fee ($0.30)
    const stripeFixedFee = 30;
    const netRefund = Math.max(0, originalAmount - stripeFixedFee);

    return {
        originalAmount,
        stripeFee: stripeFixedFee,
        netRefund
    };
};

/**
 * Generate ticket type display name with price
 * @param ticketType - Ticket type
 * @returns Display name with price
 */
export const getTicketTypeDisplayName = (ticketType: TicketType): string => {
    const price = formatPrice(ticketType.price);
    return `${ticketType.name} - ${price}`;
};

/**
 * Sort ticket types by sort_order, then by price
 * @param ticketTypes - Array of ticket types
 * @returns Sorted array
 */
export const sortTicketTypes = (ticketTypes: TicketType[]): TicketType[] => {
    return [...ticketTypes].sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
        }
        return a.price - b.price;
    });
};

/**
 * Filter active ticket types (within sale period)
 * @param ticketTypes - Array of ticket types
 * @returns Filtered array of active ticket types
 */
export const getActiveTicketTypes = (ticketTypes: TicketType[]): TicketType[] => {
    const now = new Date();

    return ticketTypes.filter(ticketType => {
        // Check sale start time
        if (ticketType.sale_start) {
            const saleStart = new Date(ticketType.sale_start);
            if (now < saleStart) return false;
        }

        // Check sale end time
        if (ticketType.sale_end) {
            const saleEnd = new Date(ticketType.sale_end);
            if (now > saleEnd) return false;
        }

        return true;
    });
};

/**
 * Calculate total revenue from ticket sales
 * @param ticketTypes - Array of ticket types with sold counts
 * @returns Total revenue in cents
 */
export const calculateTotalRevenue = (
    ticketTypes: Array<TicketType & { sold_count?: number }>
): number => {
    return ticketTypes.reduce((total, ticketType) => {
        const soldCount = ticketType.sold_count || 0;
        return total + (ticketType.price * soldCount);
    }, 0);
};

/**
 * Format date for ticket sale period display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatSaleDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Check if ticket type has capacity limits
 * @param ticketType - Ticket type to check
 * @returns True if has capacity limits
 */
export const hasCapacityLimit = (ticketType: TicketType): boolean => {
    return ticketType.capacity !== null && ticketType.capacity > 0;
};

/**
 * Get the cheapest ticket price from an array of ticket types
 * @param ticketTypes - Array of ticket types
 * @returns Minimum price in cents, or null if no tickets
 */
export const getMinimumTicketPrice = (ticketTypes: TicketType[]): number | null => {
    if (ticketTypes.length === 0) return null;

    const prices = ticketTypes.map(t => t.price);
    return Math.min(...prices);
};

/**
 * Get the most expensive ticket price from an array of ticket types
 * @param ticketTypes - Array of ticket types
 * @returns Maximum price in cents, or null if no tickets
 */
export const getMaximumTicketPrice = (ticketTypes: TicketType[]): number | null => {
    if (ticketTypes.length === 0) return null;

    const prices = ticketTypes.map(t => t.price);
    return Math.max(...prices);
};

/**
 * Format price range for display
 * @param ticketTypes - Array of ticket types
 * @returns Formatted price range string
 */
export const formatPriceRange = (ticketTypes: TicketType[]): string => {
    const minPrice = getMinimumTicketPrice(ticketTypes);
    const maxPrice = getMaximumTicketPrice(ticketTypes);

    if (minPrice === null || maxPrice === null) {
        return 'No tickets available';
    }

    if (minPrice === maxPrice) {
        return formatPrice(minPrice);
    }

    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}; 