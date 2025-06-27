import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { calculateRefundAmount } from '@/lib/utils/ticket-utils'
import { sendRefundConfirmationEmail } from '@/lib/email-service'
import { z } from 'zod'

// Database types for order with relations
interface OrderData {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string | null;
    event_id: string;
    status: string;
    total_amount: number;
    currency: string;
    refunded_at: string | null;
    refund_amount: number;
    stripe_payment_intent_id: string | null;
    guest_email: string | null;
    guest_name: string | null;
    tickets: Array<{
        id: string;
        quantity: number;
        unit_price: number;
        ticket_type_id: string;
        ticket_types: {
            name: string;
        };
    }>;
    events: {
        id: string;
        title: string;
        start_time: string;
        end_time: string;
        location: string | null;
        cancelled: boolean;
        slug: string;
    };
}

// Request validation schema
const refundRequestSchema = z.object({
    order_id: z.string().min(1), // Accept any string, we'll handle UUID conversion
    refund_type: z.enum(['full_cancellation', 'customer_request']),
    reason: z.string().min(1).max(500)
})

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json()
        console.log('Refund request received:', { order_id: body.order_id, refund_type: body.refund_type })
        
        const validationResult = refundRequestSchema.safeParse(body)

        if (!validationResult.success) {
            console.error('Validation failed:', validationResult.error.issues)
            return NextResponse.json(
                { error: 'Invalid request data', details: validationResult.error.issues },
                { status: 400 }
            )
        }

        const { order_id, refund_type, reason } = validationResult.data

        // Create Supabase client
        const supabase = await createServerSupabaseClient()

        // Get current user for authorization (moved up to avoid reference error)
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
            console.error('User authentication error:', userError)
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Handle both full UUIDs and display IDs
        const orderQuery = supabase
            .from('orders')
            .select(`
                id,
                created_at,
                updated_at,
                user_id,
                event_id,
                status,
                total_amount,
                currency,
                refunded_at,
                refund_amount,
                stripe_payment_intent_id,
                guest_email,
                guest_name,
                tickets (
                    id,
                    quantity,
                    unit_price,
                    ticket_type_id,
                    ticket_types (name)
                ),
                events (
                    id,
                    title,
                    start_time,
                    end_time,
                    location,
                    cancelled,
                    slug
                )
            `)

        // Check if order_id is a UUID (36 characters with hyphens) or a display ID (8 characters)
        let orderData: OrderData | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let orderError: any = null;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id)) {
            // It's a full UUID
            console.log('Looking up order by full UUID:', order_id)
            const result = await orderQuery.eq('id', order_id).single()
            orderData = result.data as unknown as OrderData | null
            orderError = result.error
        } else {
            // It's likely a display ID - try to find by the last 8 characters of the UUID
            console.log('Looking up order by display ID:', order_id)
            const result = await orderQuery.like('id', `%${order_id}`)
            
            if (result.data && Array.isArray(result.data) && result.data.length === 1) {
                orderData = result.data[0] as unknown as OrderData
                orderError = null
            } else if (result.data && Array.isArray(result.data) && result.data.length > 1) {
                console.error('Multiple orders found with same display ID:', order_id)
                orderError = { message: 'Multiple orders found with same display ID' }
                orderData = null
            } else {
                orderData = null
                orderError = result.error || { message: 'Order not found' }
            }
        }

        if (orderError || !orderData) {
            console.error('Order fetch error:', {
                error: orderError,
                order_id: order_id,
                errorCode: orderError?.code,
                errorMessage: orderError?.message
            })
            
            // Let's also try to see if there are any orders at all for this user
            const { data: allUserOrders, error: allOrdersError } = await supabase
                .from('orders')
                .select('id, stripe_payment_intent_id, status, user_id, guest_email')
                .limit(10)
            
            console.log('Available orders for debugging:', {
                searchedOrderId: order_id,
                currentUserId: user?.id,
                allUserOrders: allUserOrders?.map(o => ({ 
                    id: o.id, 
                    stripe_id: o.stripe_payment_intent_id,
                    user_id: o.user_id,
                    guest_email: o.guest_email,
                    status: o.status
                })),
                allOrdersError
            })
            
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        console.log('Order data fetched:', {
            order_id: orderData.id,
            status: orderData.status,
            stripe_payment_intent_id: orderData.stripe_payment_intent_id,
            total_amount: orderData.total_amount,
            refund_amount: orderData.refund_amount,
            user_id: orderData.user_id
        })

        // Comprehensive refund eligibility validation
        const now = new Date()
        const eventStartTime = new Date(orderData.events.start_time)
        const refundDeadline = new Date(eventStartTime.getTime() - 24 * 60 * 60 * 1000) // 24 hours before

        // Check order status
        if (orderData.status !== 'completed') {
            return NextResponse.json(
                { error: 'Only completed orders can be refunded' },
                { status: 400 }
            )
        }

        // Check if already fully refunded
        if (orderData.refund_amount >= orderData.total_amount) {
            return NextResponse.json(
                { error: 'Order is already fully refunded' },
                { status: 400 }
            )
        }

        // Validate refund type against event status and timing
        if (refund_type === 'full_cancellation') {
            if (!orderData.events.cancelled) {
                return NextResponse.json(
                    { error: 'Event cancellation refunds are only allowed for cancelled events' },
                    { status: 400 }
                )
            }
        } else if (refund_type === 'customer_request') {
            if (orderData.events.cancelled) {
                return NextResponse.json(
                    { error: 'Use full_cancellation type for cancelled events' },
                    { status: 400 }
                )
            }
            if (now > refundDeadline) {
                return NextResponse.json(
                    { error: 'Refund deadline has passed. Customer refunds must be requested at least 24 hours before the event.' },
                    { status: 400 }
                )
            }
        }


        console.log('Refund request debug info:', {
            order_id,
            refund_type,
            user_id: user?.id,
            order_user_id: orderData.user_id,
            order_guest_email: orderData.guest_email,
            order_status: orderData.status,
            event_cancelled: orderData.events.cancelled
        })

        // Authorization check: user must own the order
        const isOwner = user && orderData.user_id === user.id
        const isGuestOrder = !orderData.user_id && orderData.guest_email

        console.log('Authorization debug:', {
            isOwner,
            isGuestOrder,
            userAuthenticated: !!user,
            orderHasUser: !!orderData.user_id,
            orderHasGuestEmail: !!orderData.guest_email
        })

        if (!isOwner && !isGuestOrder) {
            return NextResponse.json(
                { error: 'Unauthorized to refund this order' },
                { status: 403 }
            )
        }

        // For guest orders, we should allow refunds for now (in production, add email verification)
        if (isGuestOrder && !user) {
            console.log('⚠️ Allowing guest order refund - in production, implement email verification')
        }

        // Calculate refund amount
        const remainingAmount = orderData.total_amount - orderData.refund_amount
        let refundAmount: number

        if (refund_type === 'full_cancellation') {
            // Full refund for cancelled events (no fees)
            const refundCalc = calculateRefundAmount(remainingAmount, 'full_cancellation')
            refundAmount = refundCalc.netRefund
        } else {
            // Customer request - calculate with fees
            const refundCalc = calculateRefundAmount(remainingAmount, 'customer_request')
            refundAmount = refundCalc.netRefund
        }

        if (refundAmount <= 0) {
            return NextResponse.json(
                { error: 'No refund amount calculated' },
                { status: 400 }
            )
        }

        // Check if we have a Stripe payment intent ID
        if (!orderData.stripe_payment_intent_id) {
            console.error('Order missing Stripe payment intent ID:', order_id)
            return NextResponse.json(
                { error: 'This order cannot be refunded online. Please contact support.' },
                { status: 400 }
            )
        }

        // Process Stripe refund
        let stripeRefund
        try {
            stripeRefund = await stripe.refunds.create({
                payment_intent: orderData.stripe_payment_intent_id,
                amount: refundAmount,
                reason: refund_type === 'full_cancellation' ? 'requested_by_customer' : 'requested_by_customer',
                metadata: {
                    order_id: orderData.id,
                    refund_type: refund_type,
                    reason: reason,
                    event_id: orderData.events.id
                }
            })
        } catch (stripeError: unknown) {
            console.error('Stripe refund error:', stripeError)

            // Handle specific Stripe errors
            const error = stripeError as { code?: string; message?: string }
            if (error.code === 'charge_already_refunded') {
                return NextResponse.json(
                    { error: 'This payment has already been refunded' },
                    { status: 400 }
                )
            }

            return NextResponse.json(
                { error: 'Refund processing failed', details: error instanceof Error ? error.message : String(error) },
                { status: 500 }
            )
        }

        // Update order with refund information
        const newRefundAmount = orderData.refund_amount + refundAmount
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                refund_amount: newRefundAmount,
                refunded_at: new Date().toISOString()
            })
            .eq('id', order_id)

        if (updateError) {
            console.error('Database update error:', updateError)
            // Note: Stripe refund has been processed, but database update failed
            // This should trigger an alert for manual intervention
            return NextResponse.json(
                { error: 'Refund processed but database update failed', stripeRefundId: stripeRefund.id },
                { status: 500 }
            )
        }

        // Format event date and time for email
        const eventDate = new Date(orderData.events.start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const eventTime = new Date(orderData.events.start_time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })

        // Prepare refunded tickets data for email
        const refundedTickets = orderData.tickets.map((ticket) => {
            const ticketRefundAmount = refund_type === 'full_cancellation'
                ? ticket.quantity * ticket.unit_price
                : Math.round((ticket.quantity * ticket.unit_price) * (refundAmount / remainingAmount))

            return {
                ticketType: ticket.ticket_types.name,
                quantity: ticket.quantity,
                originalPrice: ticket.quantity * ticket.unit_price,
                refundAmount: ticketRefundAmount
            }
        })

        // Send confirmation email
        try {
            const customerName = orderData.guest_name || 'Customer'
            const customerEmail = orderData.guest_email

            if (customerEmail) {
                await sendRefundConfirmationEmail({
                    to: customerEmail,
                    customerName: customerName,
                    eventTitle: orderData.events.title,
                    eventDate: eventDate,
                    eventTime: eventTime,
                    eventLocation: orderData.events.location || '',
                    refundedTickets: refundedTickets,
                    totalRefundAmount: refundAmount,
                    originalOrderAmount: orderData.total_amount,
                    refundType: refund_type,
                    stripeRefundId: stripeRefund.id,
                    orderId: orderData.id,
                    processingTimeframe: '5-10 business days',
                    refundReason: reason,
                    remainingAmount: orderData.total_amount - newRefundAmount,
                    eventSlug: orderData.events.slug
                })

                console.log('Refund confirmation email sent successfully:', {
                    orderId: order_id,
                    customerEmail: customerEmail,
                    refundAmount: refundAmount,
                    stripeRefundId: stripeRefund.id
                })
            } else {
                console.warn('No customer email found for refund confirmation:', order_id)
            }
        } catch (emailError) {
            console.error('Failed to send refund confirmation email:', emailError)
            // Don't fail the refund if email fails - log the issue
        }

        return NextResponse.json({
            success: true,
            refund: {
                id: stripeRefund.id,
                amount: refundAmount,
                status: stripeRefund.status,
                order_id: order_id,
                refund_type: refund_type,
                reason: reason,
                processing_time: '5-10 business days'
            },
            order: {
                total_amount: orderData.total_amount,
                previous_refund_amount: orderData.refund_amount,
                new_refund_amount: newRefundAmount,
                remaining_amount: orderData.total_amount - newRefundAmount
            }
        })

    } catch (error) {
        console.error('Refund processing error:', error)
        return NextResponse.json(
            { error: 'Internal server error during refund processing' },
            { status: 500 }
        )
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Refunds API is operational',
        endpoints: {
            'POST /api/refunds': 'Process refund request'
        }
    })
} 