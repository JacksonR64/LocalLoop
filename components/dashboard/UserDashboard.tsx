'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Footer } from '@/components/ui/Footer'
import { formatPrice } from '@/lib/utils/ticket-utils'
import RefundDialog from './RefundDialog'
import {
    CalendarDays,
    MapPin,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    ExternalLink,
    Download,
    Ticket,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    DollarSign,
    Users,
    Calendar
} from 'lucide-react'

interface OrderData {
    id: string
    created_at: string
    updated_at: string
    event_id: string
    status: string
    total_amount: number
    currency: string
    refunded_at?: string
    refund_amount: number
    is_refundable: boolean
    net_amount: number
    tickets_count: number
    calendar_integration_status: string
    stripe_payment_intent_id?: string
    guest_email?: string
    guest_name?: string
    events: {
        id: string
        title: string
        description?: string
        start_time: string
        end_time: string
        location?: string
        slug: string
        cancelled: boolean
    }
    tickets: Array<{
        id: string
        quantity: number
        unit_price: number
        total_price: number
        attendee_name?: string
        attendee_email?: string
        confirmation_code: string
        check_in_time?: string
        is_valid: boolean
        ticket_types: {
            id: string
            name: string
            description?: string
        }
    }>
}

interface RSVPData {
    id: string
    created_at: string
    updated_at: string
    event_id: string
    user_id: string
    status: string
    notes?: string
    events: {
        id: string
        title: string
        start_time: string
        end_time: string
        location?: string
        image_url?: string
    }
}

interface UserDashboardProps {
    user: {
        id: string
        email?: string
        full_name?: string
    } | null
}

// Define the transformed order type for RefundDialog
interface TransformedOrderForRefund {
    id: string
    status: string
    total_amount: number
    created_at: string
    refund_amount: number
    refunded_at: string | null
    is_refundable: boolean
    net_amount: number
    tickets: Array<{
        id: string
        ticket_type: {
            name: string
            price: number
        }
        quantity: number
        confirmation_code: string
    }>
    event: {
        id: string
        title: string
        start_date: string
        start_time: string
        location_name: string
        status: string
    }
}

export default function UserDashboard({ user }: UserDashboardProps) {
    const [orders, setOrders] = useState<OrderData[]>([])
    const [rsvps, setRsvps] = useState<RSVPData[]>([])
    const [loading, setLoading] = useState(true)
    const [rsvpLoading, setRsvpLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [rsvpError, setRsvpError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [refundDialogOpen, setRefundDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<TransformedOrderForRefund | null>(null)
    const [activeTab, setActiveTab] = useState('orders')

    const fetchOrders = useCallback(async () => {
        if (!user) return

        try {
            setRefreshing(true)
            const response = await fetch('/api/orders', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.id}`, // Using user ID as auth
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch orders')
            }

            const data = await response.json()
            setOrders(data.orders || [])
            setError(null)
        } catch (error) {
            console.error('Error fetching orders:', error)
            setError(error instanceof Error ? error.message : 'Failed to load orders')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [user])

    const fetchRSVPs = useCallback(async () => {
        if (!user) return

        try {
            setRsvpLoading(true)
            const response = await fetch('/api/rsvps', {
                method: 'GET',
            })

            if (!response.ok) {
                throw new Error('Failed to fetch RSVPs')
            }

            const data = await response.json()
            setRsvps(data.rsvps || [])
            setRsvpError(null)
        } catch (error) {
            console.error('Error fetching RSVPs:', error)
            setRsvpError(error instanceof Error ? error.message : 'Failed to load RSVPs')
        } finally {
            setRsvpLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchOrders()
        fetchRSVPs()
    }, [user, fetchOrders, fetchRSVPs])

    const formatDateTime = (dateString: string, timeString?: string) => {
        const date = new Date(dateString)
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })

        if (timeString) {
            return `${dateStr} at ${timeString}`
        }

        return dateStr
    }

    const isEventUpcoming = (startTime: string) => {
        return new Date(startTime) > new Date()
    }

    const getOrderStatusBadge = (order: OrderData) => {
        if (order.refunded_at && order.refund_amount > 0) {
            const isFullRefund = order.refund_amount >= order.total_amount
            return (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                    {isFullRefund ? 'Refunded' : 'Partially Refunded'}
                </Badge>
            )
        }

        switch (order.status) {
            case 'completed':
                return (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                )
            case 'failed':
                return (
                    <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                    </Badge>
                )
            case 'cancelled':
                return (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelled
                    </Badge>
                )
            default:
                return (
                    <Badge variant="secondary">
                        {order.status}
                    </Badge>
                )
        }
    }

    const getRSVPStatusBadge = (rsvp: RSVPData) => {
        const isUpcoming = isEventUpcoming(rsvp.events.start_time)

        switch (rsvp.status) {
            case 'confirmed':
                return (
                    <Badge variant="default" className={isUpcoming ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {isUpcoming ? 'Confirmed' : 'Attended'}
                    </Badge>
                )
            case 'cancelled':
                return (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelled
                    </Badge>
                )
            default:
                return (
                    <Badge variant="secondary">
                        {rsvp.status}
                    </Badge>
                )
        }
    }

    const getRefundEligibilityInfo = (order: OrderData) => {
        const isEventCancelled = order.events.cancelled
        const isFullyRefunded = order.refund_amount >= order.total_amount

        if (isFullyRefunded) {
            return {
                eligible: false,
                icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
                text: 'Fully refunded',
                variant: 'success' as const
            }
        }

        if (isEventCancelled) {
            return {
                eligible: true,
                icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
                text: 'Event cancelled - refund available',
                variant: 'warning' as const
            }
        }

        if (order.is_refundable) {
            return {
                eligible: true,
                icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
                text: 'Refund available (24h policy)',
                variant: 'success' as const
            }
        }

        return {
            eligible: false,
            icon: <XCircle className="w-4 h-4 text-red-600" />,
            text: 'Refund window closed',
            variant: 'error' as const
        }
    }

    const handleRefundClick = (order: OrderData) => {
        // Transform OrderData to OrderWithTickets format for RefundDialog
        const transformedOrder = {
            id: order.id,
            status: order.status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            refund_amount: order.refund_amount,
            refunded_at: order.refunded_at || null,
            is_refundable: order.is_refundable,
            net_amount: order.net_amount,
            tickets: order.tickets.map(ticket => ({
                id: ticket.id,
                ticket_type: {
                    name: ticket.ticket_types.name,
                    price: ticket.unit_price
                },
                quantity: ticket.quantity,
                confirmation_code: ticket.confirmation_code
            })),
            event: {
                id: order.events.id,
                title: order.events.title,
                start_date: order.events.start_time.split('T')[0], // Extract date part
                start_time: new Date(order.events.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }),
                location_name: order.events.location || 'TBD',
                status: order.events.cancelled ? 'cancelled' : 'active'
            }
        }

        setSelectedOrder(transformedOrder as TransformedOrderForRefund)
        setRefundDialogOpen(true)
    }

    const handleRefundSuccess = () => {
        // Refresh orders to show updated refund status
        fetchOrders()
        setSelectedOrder(null)
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
                    <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here are your tickets, orders, and event RSVPs.
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders" className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        Tickets & Orders
                        {orders.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {orders.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="rsvps" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        RSVPs
                        {rsvps.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {rsvps.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                            <span className="text-gray-600">Loading your orders...</span>
                        </div>
                    ) : error ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                            <p className="text-gray-600 mb-6">
                                When you purchase tickets, they&apos;ll appear here.
                            </p>
                            <Button asChild>
                                <Link href="/">Browse Events</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order) => {
                                const refundInfo = getRefundEligibilityInfo(order)

                                return (
                                    <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                        {/* Order Header */}
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {order.events.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Order #{order.id.slice(-8)} • {formatDateTime(order.created_at)}
                                                        </p>
                                                    </div>
                                                    {getOrderStatusBadge(order)}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {formatPrice(order.net_amount)}
                                                    </div>
                                                    {order.refund_amount > 0 && (
                                                        <div className="text-sm text-green-600">
                                                            -{formatPrice(order.refund_amount)} refunded
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Event Details */}
                                        <div className="px-6 py-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <CalendarDays className="w-4 h-4" />
                                                    <span>{formatDateTime(order.events.start_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4" />
                                                    {order.events.location && (
                                                        <span>{order.events.location}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    {refundInfo.icon}
                                                    <span className={
                                                        refundInfo.variant === 'success' ? 'text-green-600' :
                                                            refundInfo.variant === 'warning' ? 'text-orange-600' :
                                                                'text-red-600'
                                                    }>
                                                        {refundInfo.text}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Tickets */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-gray-700">Tickets</h4>
                                                {order.tickets.map((ticket) => (
                                                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Ticket className="w-4 h-4 text-gray-500" />
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {ticket.quantity}x {ticket.ticket_types.name}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    Confirmation: {ticket.confirmation_code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-medium text-gray-900">
                                                                {formatPrice(ticket.total_price)}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {formatPrice(ticket.unit_price)} each
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/events/${order.events.slug}`}>
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            View Event
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download Receipt
                                                    </Button>
                                                </div>

                                                {refundInfo.eligible && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRefundClick(order)}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        <DollarSign className="w-4 h-4 mr-2" />
                                                        Request Refund
                                                        <ChevronRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* RSVPs Tab */}
                <TabsContent value="rsvps" className="mt-6">
                    {rsvpLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                            <span className="text-gray-600">Loading your RSVPs...</span>
                        </div>
                    ) : rsvpError ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{rsvpError}</AlertDescription>
                        </Alert>
                    ) : rsvps.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No RSVPs yet</h3>
                            <p className="text-gray-600 mb-6">
                                When you RSVP to free events, they&apos;ll appear here.
                            </p>
                            <Button asChild>
                                <Link href="/">Browse Events</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {rsvps.map((rsvp) => {
                                const isUpcoming = isEventUpcoming(rsvp.events.start_time)

                                return (
                                    <div key={rsvp.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                        {/* RSVP Header */}
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {rsvp.events.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            RSVP #{rsvp.id.slice(-8)} • {formatDateTime(rsvp.created_at)}
                                                        </p>
                                                    </div>
                                                    {getRSVPStatusBadge(rsvp)}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-semibold text-green-600">
                                                        FREE
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {isUpcoming ? 'Upcoming' : 'Past Event'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Event Details */}
                                        <div className="px-6 py-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <CalendarDays className="w-4 h-4" />
                                                    <span>{formatDateTime(rsvp.events.start_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4" />
                                                    {rsvp.events.location && (
                                                        <span>{rsvp.events.location}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {rsvp.notes && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-gray-700">Notes</h4>
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">{rsvp.notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/events/${rsvp.event_id}`}>
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            View Event
                                                        </Link>
                                                    </Button>
                                                    {isUpcoming && (
                                                        <Button variant="outline" size="sm">
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            Add to Calendar
                                                        </Button>
                                                    )}
                                                </div>

                                                {isUpcoming && rsvp.status === 'confirmed' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Cancel RSVP
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Refresh Button */}
            <div className="mt-8 text-center">
                <Button
                    onClick={() => {
                        fetchOrders()
                        fetchRSVPs()
                    }}
                    variant="outline"
                    disabled={refreshing || loading || rsvpLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* Refund Dialog */}
            <RefundDialog
                open={refundDialogOpen}
                onOpenChange={setRefundDialogOpen}
                order={selectedOrder}
                onRefundSuccess={handleRefundSuccess}
            />

            {/* Footer */}
            <Footer />
        </div>
    )
} 