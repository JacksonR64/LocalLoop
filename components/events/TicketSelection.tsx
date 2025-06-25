'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatPrice } from '@/lib/utils/ticket-utils'
import {
    ShoppingCart,
    Plus,
    Minus,
    Calendar,
    Users,
    AlertCircle
} from 'lucide-react'

interface TicketType {
    id: string
    event_id: string
    name: string
    description: string
    price: number
    capacity: number
    sold_count: number
    sort_order: number
    sale_start: string
    sale_end: string
    created_at: string
    updated_at: string
}

interface TicketSelection {
    ticket_type_id: string
    ticket_type: {
        id: string
        name: string
        price: number
    }
    quantity: number
    unit_price: number
    total_price: number
}

interface TicketSelectionProps {
    eventId: string
    selectedTickets: TicketSelection[]
    onTicketsChange: (tickets: TicketSelection[]) => void
}

export default function TicketSelection({
    eventId,
    selectedTickets = [],
    onTicketsChange
}: TicketSelectionProps) {
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [quantities, setQuantities] = useState<Record<string, number>>({})

    // Load ticket types
    useEffect(() => {
        const fetchTicketTypes = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/ticket-types?event_id=${eventId}`)

                if (!response.ok) {
                    throw new Error('Failed to fetch ticket types')
                }

                const data = await response.json()
                setTicketTypes(data.ticket_types || [])

                // Initialize quantities with existing selections
                const initialQuantities: Record<string, number> = {}
                data.ticket_types?.forEach((ticket: TicketType) => {
                    const existing = (selectedTickets || []).find(st => st.ticket_type_id === ticket.id)
                    initialQuantities[ticket.id] = existing?.quantity || 0
                })
                setQuantities(initialQuantities)

            } catch (err) {
                console.error('Error fetching ticket types:', err)
                setError('Failed to load ticket information')
            } finally {
                setLoading(false)
            }
        }

        if (eventId) {
            fetchTicketTypes()
        }
    }, [eventId, selectedTickets])

    // Update quantities and notify parent
    const updateQuantity = (ticketTypeId: string, newQuantity: number) => {
        const ticketType = ticketTypes.find(t => t.id === ticketTypeId)
        if (!ticketType) return

        const maxQuantity = Math.max(0, ticketType.capacity - ticketType.sold_count)
        const validQuantity = Math.max(0, Math.min(newQuantity, maxQuantity))

        const newQuantities = {
            ...quantities,
            [ticketTypeId]: validQuantity
        }
        setQuantities(newQuantities)

        // Update selected tickets
        const updatedSelections = Object.entries(newQuantities)
            .filter(([, qty]) => qty > 0)
            .map(([ticketId, qty]) => {
                const ticket = ticketTypes.find(t => t.id === ticketId)
                if (!ticket) {
                    console.error(`Ticket type not found for ID: ${ticketId}`)
                    return null
                }
                
                // Ensure price is a valid number
                const ticketPrice = ticket.price ?? 0
                
                return {
                    ticket_type_id: ticketId,
                    ticket_type: {
                        id: ticket.id,
                        name: ticket.name,
                        price: ticketPrice
                    },
                    quantity: qty,
                    unit_price: ticketPrice,
                    total_price: ticketPrice * qty
                }
            })
            .filter((selection): selection is TicketSelection => selection !== null)

        onTicketsChange(updatedSelections)
    }

    // Calculate totals with safety checks
    const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + (qty || 0), 0)
    const totalPrice = (selectedTickets || []).reduce((sum, ticket) => {
        const price = ticket?.total_price ?? 0
        return sum + (isNaN(price) ? 0 : price)
    }, 0)

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                    <span className="ml-2">Loading tickets...</span>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-8">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    if (ticketTypes.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tickets available for this event.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6" data-test-id="ticket-selection-container">
            <Card data-test-id="ticket-types-card">
                <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-2" data-test-id="ticket-section-title">
                        <ShoppingCart className="h-5 w-5" />
                        Get Your Tickets
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                    {ticketTypes.map((ticket) => {
                        // Handle undefined sold_count gracefully
                        const soldCount = ticket.sold_count || 0
                        const capacity = ticket.capacity || 1000
                        const available = Math.max(0, capacity - soldCount)
                        const quantity = quantities[ticket.id] || 0
                        const isAvailable = available > 0

                        // Fix sale period validation - handle null dates properly
                        const now = new Date()
                        let saleActive = true // Default to active if no sale dates set

                        if (ticket.sale_start) {
                            const saleStart = new Date(ticket.sale_start)
                            if (now < saleStart) saleActive = false
                        }

                        if (ticket.sale_end) {
                            const saleEnd = new Date(ticket.sale_end)
                            if (now > saleEnd) saleActive = false
                        }

                        return (
                            <div
                                key={ticket.id}
                                className={`p-4 border border-border rounded-lg ${!isAvailable || !saleActive ? 'bg-muted' : 'bg-card'}`}
                                data-test-id={`ticket-type-${ticket.id}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-foreground" data-test-id="ticket-type-name">{ticket.name}</h3>
                                        <p className="text-muted-foreground text-sm mb-2" data-test-id="ticket-type-description">{ticket.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1" data-test-id="ticket-availability">
                                                <Users className="h-4 w-4" />
                                                {`${available} / ${capacity} available`}
                                            </span>
                                            <span className="font-semibold text-lg text-foreground" data-test-id="ticket-price">
                                                {formatPrice(ticket.price)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!saleActive ? (
                                    <div className="flex items-center gap-2 text-amber-600" data-test-id="sale-ended-message">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-sm">Sales period has ended</span>
                                    </div>
                                ) : !isAvailable ? (
                                    <div className="flex items-center gap-2 text-red-600" data-test-id="sold-out-message">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-sm">Sold out</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3" data-test-id="quantity-controls">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <label 
                                                    id={`quantity-label-${ticket.id}`}
                                                    htmlFor={`quantity-${ticket.id}`}
                                                    className="text-sm font-medium"
                                                >
                                                    Quantity:
                                                </label>
                                                <div className="flex items-center gap-2" role="group" aria-labelledby={`quantity-label-${ticket.id}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(ticket.id, quantity - 1)}
                                                        disabled={quantity <= 0}
                                                        className="h-8 w-8 p-0"
                                                        data-test-id="decrease-quantity-button"
                                                        aria-label={`Decrease quantity for ${ticket.name}`}
                                                        aria-controls={`quantity-${ticket.id}`}
                                                    >
                                                        <Minus className="h-4 w-4" aria-hidden="true" />
                                                    </Button>
                                                    <Input
                                                        id={`quantity-${ticket.id}`}
                                                        name={`quantity-${ticket.id}`}
                                                        type="number"
                                                        min="0"
                                                        max={available}
                                                        value={quantity}
                                                        onChange={(e) => updateQuantity(ticket.id, parseInt(e.target.value) || 0)}
                                                        className="w-16 text-center"
                                                        data-test-id="quantity-input"
                                                        aria-label={`Quantity for ${ticket.name}`}
                                                        aria-describedby={`quantity-help-${ticket.id}`}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(ticket.id, quantity + 1)}
                                                        disabled={quantity >= available}
                                                        className="h-8 w-8 p-0"
                                                        data-test-id="increase-quantity-button"
                                                        aria-label={`Increase quantity for ${ticket.name}`}
                                                        aria-controls={`quantity-${ticket.id}`}
                                                    >
                                                        <Plus className="h-4 w-4" aria-hidden="true" />
                                                    </Button>
                                                    <span 
                                                        id={`quantity-help-${ticket.id}`} 
                                                        className="sr-only"
                                                    >
                                                        Use + and - buttons or type to select quantity. Maximum {available} tickets available.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {quantity > 0 && (
                                            <div className="flex justify-between items-center pt-2 border-t border-border" data-test-id="ticket-subtotal">
                                                <span className="text-sm text-muted-foreground">Subtotal:</span>
                                                <span className="font-semibold text-foreground" data-test-id="subtotal-amount">
                                                    {formatPrice((ticket.price ?? 0) * quantity)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {totalQuantity > 0 && (
                <Card data-test-id="ticket-summary-card">
                    <CardContent className="py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-semibold" data-test-id="total-quantity">
                                    Total: {totalQuantity} ticket{totalQuantity !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-muted-foreground" data-test-id="ticket-breakdown">
                                    {(selectedTickets || []).map(ticket =>
                                        `${ticket.quantity}x ${ticket.ticket_type.name}`
                                    ).join(', ')}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold" data-test-id="total-price">
                                    {formatPrice(totalPrice)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 