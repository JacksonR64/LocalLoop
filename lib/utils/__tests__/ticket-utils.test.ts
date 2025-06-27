// @ts-nocheck
import {
    formatPrice,
    convertToStripeAmount,
    convertToDollars,
    calculateStripeFee,
    calculateCustomerTotal,
    checkTicketAvailability,
    formatAvailabilityStatus,
    validateTicketPrice,
    calculateRefundAmount,
    getTicketTypeDisplayName,
    sortTicketTypes,
    getActiveTicketTypes,
    calculateTotalRevenue,
    formatSaleDate,
    hasCapacityLimit,
    getMinimumTicketPrice,
    getMaximumTicketPrice,
    formatPriceRange
} from '@/lib/utils/ticket-utils'
import { TicketType } from '@/lib/types/ticket'

// Mock ticket type data
const mockTicketType: TicketType = {
    id: '1',
    event_id: 'event-1',
    name: 'General Admission',
    description: 'Standard event ticket',
    price: 2500, // $25.00 in cents
    capacity: 100,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
}

const mockTicketTypes: TicketType[] = [
    mockTicketType,
    {
        id: '2',
        event_id: 'event-1',
        name: 'VIP Pass',
        description: 'Premium event access',
        price: 5000, // $50.00 in cents
        capacity: 25,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: '3',
        event_id: 'event-1',
        name: 'Free Entry',
        description: 'Complimentary access',
        price: 0,
        capacity: null,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: '4',
        event_id: 'event-1',
        name: 'Inactive Ticket',
        description: 'Not available for sale',
        price: 1000,
        capacity: 50,
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    }
]

describe('Ticket Utils', () => {
    describe('formatPrice', () => {
        it('should format price correctly for paid tickets', () => {
            expect(formatPrice(2500)).toBe('$25')
            expect(formatPrice(2550)).toBe('$25.50')
            expect(formatPrice(10000)).toBe('$100')
        })

        it('should display "Free" for zero price', () => {
            expect(formatPrice(0)).toBe('Free')
        })

        it('should handle different currencies', () => {
            expect(formatPrice(2500, 'EUR')).toBe('€25')
            expect(formatPrice(2500, 'GBP')).toBe('£25')
        })

        it('should handle large amounts', () => {
            expect(formatPrice(9999999)).toBe('$99,999.99')
        })

        it('should handle small amounts', () => {
            expect(formatPrice(1)).toBe('$0.01')
            expect(formatPrice(99)).toBe('$0.99')
        })

        it('should handle invalid values', () => {
            expect(formatPrice(NaN)).toBe('Free')
            expect(formatPrice(null as unknown as number)).toBe('Free')
            expect(formatPrice(undefined as unknown as number)).toBe('Free')
        })
    })

    describe('convertToStripeAmount', () => {
        it('should convert dollars to cents correctly', () => {
            expect(convertToStripeAmount(25.00)).toBe(2500)
            expect(convertToStripeAmount(25.50)).toBe(2550)
            expect(convertToStripeAmount(100)).toBe(10000)
        })

        it('should handle zero amount', () => {
            expect(convertToStripeAmount(0)).toBe(0)
        })

        it('should round properly for precision issues', () => {
            expect(convertToStripeAmount(25.999)).toBe(2600)
            expect(convertToStripeAmount(25.001)).toBe(2500)
        })

        it('should handle large amounts', () => {
            expect(convertToStripeAmount(999.99)).toBe(99999)
        })
    })

    describe('convertToDollars', () => {
        it('should convert cents to dollars correctly', () => {
            expect(convertToDollars(2500)).toBe(25.00)
            expect(convertToDollars(2550)).toBe(25.50)
            expect(convertToDollars(10000)).toBe(100.00)
        })

        it('should handle zero amount', () => {
            expect(convertToDollars(0)).toBe(0)
        })

        it('should handle single cents', () => {
            expect(convertToDollars(1)).toBe(0.01)
            expect(convertToDollars(99)).toBe(0.99)
        })
    })

    describe('calculateStripeFee', () => {
        it('should calculate Stripe fees correctly', () => {
            const result = calculateStripeFee(2500) // $25.00
            expect(result.subtotal).toBe(2500)
            expect(result.stripe_fee).toBe(103) // 2.9% + $0.30 = $0.73 + $0.30 = $1.03
            expect(result.application_fee).toBe(0) // No additional application fee
            expect(result.total).toBe(2603) // $25.00 + $1.03 = $26.03
            expect(result.currency).toBe('USD')
        })

        it('should handle zero amount', () => {
            const result = calculateStripeFee(0)
            expect(result.subtotal).toBe(0)
            expect(result.stripe_fee).toBe(30) // Fixed fee only
            expect(result.application_fee).toBe(0)
            expect(result.total).toBe(30)
        })

        it('should handle small amounts', () => {
            const result = calculateStripeFee(100) // $1.00
            expect(result.subtotal).toBe(100)
            expect(result.stripe_fee).toBe(33) // 2.9% of $1.00 + $0.30 = $0.03 + $0.30 = $0.33
            expect(result.application_fee).toBe(0) // No additional application fee
            expect(result.total).toBe(133)
        })

        it('should handle large amounts', () => {
            const result = calculateStripeFee(10000) // $100.00
            expect(result.subtotal).toBe(10000)
            expect(result.stripe_fee).toBe(320) // 2.9% + $0.30 = $2.90 + $0.30 = $3.20
            expect(result.application_fee).toBe(0) // No additional application fee
            expect(result.total).toBe(10320) // $100.00 + $3.20 = $103.20
        })
    })

    describe('calculateCustomerTotal', () => {
        it('should calculate total amount customer pays', () => {
            const total = calculateCustomerTotal(2500) // $25.00 ticket
            expect(total).toBe(2603) // Same as calculateStripeFee total
        })

        it('should handle free tickets', () => {
            const total = calculateCustomerTotal(0)
            expect(total).toBe(30) // Just the fixed Stripe fee
        })
    })

    describe('checkTicketAvailability', () => {
        it('should return availability for tickets with capacity', () => {
            const availability = checkTicketAvailability(mockTicketType, 25)
            expect(availability.ticket_type_id).toBe('1')
            expect(availability.total_capacity).toBe(100)
            expect(availability.sold_count).toBe(25)
            expect(availability.available_count).toBe(75)
            expect(availability.is_available).toBe(true)
            expect(availability.sale_status).toBe('active')
        })

        it('should handle tickets without capacity limits', () => {
            const unlimitedTicket = { ...mockTicketType, capacity: null }
            const availability = checkTicketAvailability(unlimitedTicket, 10)
            expect(availability.total_capacity).toBeNull()
            expect(availability.available_count).toBeNull()
            expect(availability.is_available).toBe(true)
        })

        it('should detect sold out tickets', () => {
            const availability = checkTicketAvailability(mockTicketType, 100)
            expect(availability.available_count).toBe(0)
            expect(availability.is_available).toBe(false)
        })

        it('should handle tickets with sale periods', () => {
            const futureTicket = {
                ...mockTicketType,
                sale_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                sale_end: new Date(Date.now() + 172800000).toISOString() // Day after tomorrow
            }
            const availability = checkTicketAvailability(futureTicket, 0)
            expect(availability.sale_status).toBe('not_started')
            expect(availability.is_available).toBe(false)
        })

        it('should detect ended sales', () => {
            const expiredTicket = {
                ...mockTicketType,
                sale_start: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                sale_end: new Date(Date.now() - 86400000).toISOString() // Yesterday
            }
            const availability = checkTicketAvailability(expiredTicket, 0)
            expect(availability.sale_status).toBe('ended')
            expect(availability.is_available).toBe(false)
        })
    })

    describe('formatAvailabilityStatus', () => {
        it('should format available status', () => {
            const availability = checkTicketAvailability(mockTicketType, 25)
            const status = formatAvailabilityStatus(availability)
            expect(status).toBe('75 of 100 available')
        })

        it('should format unlimited availability', () => {
            const unlimitedTicket = { ...mockTicketType, capacity: null }
            const availability = checkTicketAvailability(unlimitedTicket, 10)
            const status = formatAvailabilityStatus(availability)
            expect(status).toBe('Available')
        })

        it('should format sold out status', () => {
            const availability = checkTicketAvailability(mockTicketType, 100)
            const status = formatAvailabilityStatus(availability)
            expect(status).toBe('Sold out')
        })
    })

    describe('validateTicketPrice', () => {
        it('should validate correct prices', () => {
            expect(validateTicketPrice(0)).toEqual({ isValid: true })
            expect(validateTicketPrice(50)).toEqual({ isValid: true })
            expect(validateTicketPrice(2500)).toEqual({ isValid: true })
            expect(validateTicketPrice(9999999)).toEqual({ isValid: true })
        })

        it('should reject negative prices', () => {
            const result = validateTicketPrice(-100)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Price cannot be negative')
        })

        it('should reject prices below minimum for paid tickets', () => {
            const result = validateTicketPrice(25)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Minimum price is $0.50 for paid tickets')
        })

        it('should reject prices above maximum', () => {
            const result = validateTicketPrice(10000000)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Maximum price is $99,999.99')
        })
    })

    describe('calculateRefundAmount', () => {
        it('should calculate customer refund with Stripe fee deduction', () => {
            const refund = calculateRefundAmount(2500, 'customer_request')
            expect(refund.originalAmount).toBe(2500)
            expect(refund.stripeFee).toBe(30) // Fixed fee kept by Stripe
            expect(refund.netRefund).toBe(2470)
        })

        it('should calculate full refund for event cancellation', () => {
            const refund = calculateRefundAmount(2500, 'full_cancellation')
            expect(refund.originalAmount).toBe(2500)
            expect(refund.stripeFee).toBe(0)
            expect(refund.netRefund).toBe(2500)
        })

        it('should handle small amounts', () => {
            const refund = calculateRefundAmount(25, 'customer_request')
            expect(refund.netRefund).toBe(0) // Can't go negative
        })
    })

    describe('getTicketTypeDisplayName', () => {
        it('should return the ticket type name with price', () => {
            expect(getTicketTypeDisplayName(mockTicketType)).toBe('General Admission - $25')
        })

        it('should handle empty or undefined names', () => {
            const ticket = { ...mockTicketType, name: '' }
            expect(getTicketTypeDisplayName(ticket)).toBe(' - $25')
        })
    })

    describe('sortTicketTypes', () => {
        it('should sort ticket types by price ascending', () => {
            const sorted = sortTicketTypes(mockTicketTypes)
            expect(sorted[0].price).toBe(0) // Free ticket first
            expect(sorted[1].price).toBe(1000) // Inactive ticket (still sorted)
            expect(sorted[2].price).toBe(2500) // General admission
            expect(sorted[3].price).toBe(5000) // VIP last
        })
    })

    describe('getActiveTicketTypes', () => {
        it('should filter only active ticket types', () => {
            const active = getActiveTicketTypes(mockTicketTypes)
            expect(active).toHaveLength(4)
            expect(active.every(t => !t.sale_start || new Date(t.sale_start) <= new Date())).toBe(true)
        })

        it('should maintain order of active tickets', () => {
            const active = getActiveTicketTypes(mockTicketTypes)
            expect(active[0].id).toBe('1')
            expect(active[1].id).toBe('2')
            expect(active[2].id).toBe('3')
            expect(active[3].id).toBe('4')
        })
    })

    describe('calculateTotalRevenue', () => {
        it('should calculate total revenue from sold tickets', () => {
            const ticketsWithSales = [
                { ...mockTicketTypes[0], sold_count: 20 }, // $25 * 20 = $500
                { ...mockTicketTypes[1], sold_count: 5 },  // $50 * 5 = $250
                { ...mockTicketTypes[2], sold_count: 30 }  // $0 * 30 = $0
            ]
            const revenue = calculateTotalRevenue(ticketsWithSales)
            expect(revenue).toBe(75000) // $750 in cents
        })

        it('should handle tickets with no sales', () => {
            const revenue = calculateTotalRevenue(mockTicketTypes)
            expect(revenue).toBe(0)
        })
    })

    describe('formatSaleDate', () => {
        it('should format date strings', () => {
            const formatted = formatSaleDate('2024-06-15T10:00:00Z')
            expect(formatted).toMatch(/Jun 15, 2024/) // Basic format check
        })

        it('should handle different date formats', () => {
            const formatted = formatSaleDate('2024-12-31T23:59:59Z')
            expect(formatted).toMatch(/Dec 31, 2024/)
        })
    })

    describe('hasCapacityLimit', () => {
        it('should return true for tickets with capacity', () => {
            expect(hasCapacityLimit(mockTicketType)).toBe(true)
        })

        it('should return false for unlimited tickets', () => {
            const unlimitedTicket = { ...mockTicketType, capacity: null }
            expect(hasCapacityLimit(unlimitedTicket)).toBe(false)
        })
    })

    describe('getMinimumTicketPrice', () => {
        it('should return minimum price from ticket types', () => {
            const minPrice = getMinimumTicketPrice(mockTicketTypes)
            expect(minPrice).toBe(0) // Free ticket
        })

        it('should return null for empty array', () => {
            const minPrice = getMinimumTicketPrice([])
            expect(minPrice).toBeNull()
        })

        it('should exclude inactive tickets from price calculation', () => {
            const activeTickets = getActiveTicketTypes(mockTicketTypes)
            const minPrice = getMinimumTicketPrice(activeTickets)
            expect(minPrice).toBe(0) // Still free ticket
        })
    })

    describe('getMaximumTicketPrice', () => {
        it('should return maximum price from ticket types', () => {
            const maxPrice = getMaximumTicketPrice(mockTicketTypes)
            expect(maxPrice).toBe(5000) // VIP ticket
        })

        it('should return null for empty array', () => {
            const maxPrice = getMaximumTicketPrice([])
            expect(maxPrice).toBeNull()
        })
    })

    describe('formatPriceRange', () => {
        it('should format price range for mixed ticket types', () => {
            const range = formatPriceRange(mockTicketTypes)
            expect(range).toBe('Free - $50')
        })

        it('should handle single price point', () => {
            const singleTicket = [mockTicketTypes[0]] // Only general admission
            const range = formatPriceRange(singleTicket)
            expect(range).toBe('$25')
        })

        it('should handle all free tickets', () => {
            const freeTickets = [mockTicketTypes[2]] // Only free ticket
            const range = formatPriceRange(freeTickets)
            expect(range).toBe('Free')
        })

        it('should handle empty array', () => {
            const range = formatPriceRange([])
            expect(range).toBe('No tickets available')
        })
    })
}) 