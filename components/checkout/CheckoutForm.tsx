'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js'
import { Card, CardContent, IconCard } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/auth-context'
import { formatPrice } from '@/lib/utils/ticket-utils'
import {
    CreditCard,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Mail,
    User
} from 'lucide-react'
import { useTheme } from 'next-themes'
import GoogleCalendarAddButton from './GoogleCalendarAddButton'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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

interface CheckoutFormProps {
    eventId: string
    selectedTickets: TicketSelection[]
    guestInfo?: {
        email: string
        name: string
    }
    onSuccess: (paymentIntentId: string) => void
    onCancel: () => void
}

interface CheckoutResponse {
    client_secret: string
    payment_intent_id: string
    amount: number
    subtotal: number
    fees: number
    ticket_items: Array<{
        ticket_type_id: string
        ticket_type_name: string
        quantity: number
        unit_price: number
        total_price: number
    }>
    event: {
        id: string
        title: string
        description?: string
        start_time: string
        end_time: string
        location?: string
        timezone: string
    }
    order_id?: string
}

// Payment form component that uses Stripe Elements
function PaymentForm({
    orderDetails,
    customerInfo,
    onSuccess,
    onCancel
}: {
    orderDetails: CheckoutResponse
    customerInfo: { email: string; name: string }
    onSuccess: (paymentIntentId: string) => void
    onCancel: () => void
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [processing, setProcessing] = useState(false)
    const [paymentError, setPaymentError] = useState<string | null>(null)

    // Customer information state - start with provided info but allow editing
    const [customerDetails, setCustomerDetails] = useState({
        email: customerInfo.email,
        name: customerInfo.name
    })

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setProcessing(true)
        setPaymentError(null)

        try {
            // Ensure we have a valid return URL with proper fallback for production
            const baseUrl = typeof window !== 'undefined'
                ? window.location.origin
                : process.env.NEXT_PUBLIC_SITE_URL || 'https://localloop.app';
            const returnUrl = `${baseUrl}/events/${orderDetails.event.id}?payment=success`;


            const result = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: returnUrl,
                    receipt_email: customerDetails.email,
                },
                redirect: 'always'  // Always redirect to show payment success
            })

            if (result.error) {
                console.error('Stripe payment error:', result.error);
                console.error('Error type:', result.error.type);
                console.error('Error code:', result.error.code);
                setPaymentError(result.error.message || 'An error occurred during payment processing')
            } else if ('paymentIntent' in result && result.paymentIntent) {
                const paymentIntent = result.paymentIntent as any;
                // Update customer information in our system if it changed
                if (customerDetails.email !== customerInfo.email || customerDetails.name !== customerInfo.name) {
                    try {
                        await fetch('/api/update-customer-info', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                payment_intent_id: paymentIntent.id,
                                customer_email: customerDetails.email,
                                customer_name: customerDetails.name
                            })
                        })
                    } catch (updateError) {
                        console.warn('Failed to update customer information:', updateError)
                        // Don't fail the payment for this
                    }
                }

                // Payment succeeded
                onSuccess(paymentIntent.id)
            }
        } catch (err) {
            console.error('Payment confirmation error:', err)
            setPaymentError('Payment processing failed. Please try again.')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Summary */}
            <IconCard 
                cardType="order-summary"
                contentProps={{ className: "space-y-3" }}
            >
                <div className="text-sm font-medium text-foreground">
                    {orderDetails.event.title}
                </div>

                    {orderDetails.ticket_items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm text-foreground">
                            <span>{item.quantity}x {item.ticket_type_name}</span>
                            <span>{formatPrice(item.total_price)}</span>
                        </div>
                    ))}

                    <div className="border-t pt-3 space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatPrice(orderDetails.subtotal)}</span>
                        </div>
                        {orderDetails.fees > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Processing fees</span>
                                <span>{formatPrice(orderDetails.fees)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{formatPrice(orderDetails.amount)}</span>
                        </div>
                    </div>
            </IconCard>

            {/* Customer Information */}
            <IconCard 
                cardType="customer-info"
                contentProps={{ className: "space-y-4" }}
            >
                <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" htmlFor="customer-email">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    id="customer-email"
                                    type="email"
                                    value={customerDetails.email}
                                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                    placeholder="your@email.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Your ticket confirmation will be sent to this email
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" htmlFor="customer-name">
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    id="customer-name"
                                    type="text"
                                    value={customerDetails.name}
                                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                    autoComplete="name"
                                    placeholder="Your full name"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Name as it should appear on your ticket
                            </p>
                        </div>
                    </div>
            </IconCard>

            {/* Payment Information */}
            <IconCard cardType="payment-info">
                    <PaymentElement
                        options={{
                            layout: 'tabs',
                            defaultValues: {
                                billingDetails: {
                                    email: customerDetails.email,
                                    name: customerDetails.name,
                                }
                            }
                        }}
                    />

                    {paymentError && (
                        <Alert className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{paymentError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={processing}
                            className="flex-1 min-w-0"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Back to Tickets</span>
                        </Button>

                        <Button
                            type="submit"
                            disabled={!stripe || processing || !customerDetails.email || !customerDetails.name}
                            className="flex-1 min-w-0"
                        >
                            {processing ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2 flex-shrink-0" />
                                    <span className="truncate">Processing...</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="truncate">Pay {formatPrice(orderDetails.amount)}</span>
                                </>
                            )}
                        </Button>
                    </div>
            </IconCard>
        </form>
    )
}

// Success component
function PaymentSuccess({
    paymentIntentId,
    orderDetails,
    onContinue
}: {
    paymentIntentId: string
    orderDetails: CheckoutResponse
    onContinue: () => void
}) {
    return (
        <Card>
            <CardContent className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-700 mb-2">
                    Payment Successful!
                </h2>
                <p className="text-muted-foreground mb-6">
                    Your tickets have been purchased successfully.
                </p>

                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Order Details</h3>
                    <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                        <div>Payment ID: {paymentIntentId}</div>
                        <div>Event: {orderDetails.event.title}</div>
                        <div>Total: {formatPrice(orderDetails.amount)}</div>
                        <div>
                            Tickets: {orderDetails.ticket_items.map(item =>
                                `${item.quantity}x ${item.ticket_type_name}`
                            ).join(', ')}
                        </div>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground mb-6">
                    A confirmation email with your tickets has been sent to your email address.
                    Please save this email as it contains important information for event entry.
                </div>

                <div className="overflow-hidden mb-6">
                    <GoogleCalendarAddButton
                        eventTitle={orderDetails.event.title}
                        eventTime={orderDetails.event.start_time}
                        eventLocation={orderDetails.event.location || 'Online Event'}
                        className="w-full max-w-full"
                    />
                </div>

                <Button onClick={onContinue} className="w-full min-w-0">
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Continue to Event</span>
                </Button>
            </CardContent>
        </Card>
    )
}

// Main checkout form component
export default function CheckoutForm({
    eventId,
    selectedTickets,
    guestInfo,
    onSuccess,
    onCancel
}: CheckoutFormProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [orderDetails, setOrderDetails] = useState<CheckoutResponse | null>(null)
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

    // Get customer information (memoized to prevent infinite re-renders)
    const customerInfo = useMemo(() => ({
        email: guestInfo?.email || user?.email || '',
        name: guestInfo?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || ''
    }), [guestInfo?.email, guestInfo?.name, user?.email, user?.user_metadata?.full_name, user?.user_metadata?.name])

    // Get current theme for Stripe appearance
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    // Memoize stripe options to prevent clientSecret mutation warnings
    const stripeOptions = useMemo(() => {
        if (!clientSecret) return undefined;
        
        return {
            clientSecret,
            appearance: {
                theme: isDark ? 'night' as const : 'stripe' as const,
                variables: {
                    // Use only valid Stripe appearance variables
                    colorPrimary: isDark ? '#64748b' : '#475569',
                    // Note: colorBackground removed - using rules for transparency instead
                    colorText: isDark ? '#f8fafc' : '#1f2937',
                    colorTextSecondary: isDark ? '#94a3b8' : '#6b7280',
                    colorTextPlaceholder: isDark ? '#64748b' : '#9ca3af',
                    colorDanger: '#dc2626',
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px',
                    fontSizeBase: '14px',
                    fontWeightNormal: '500',
                },
                rules: {
                    // Clear/transparent styling for all elements
                    '.Input': {
                        backgroundColor: 'transparent',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        color: isDark ? '#f8fafc' : '#1f2937'
                    },
                    '.Input:focus': {
                        backgroundColor: 'transparent',
                        border: isDark ? '1px solid #64748b' : '1px solid #475569',
                        boxShadow: isDark ? '0 0 0 1px #64748b' : '0 0 0 1px #475569'
                    },
                    '.Tab': {
                        backgroundColor: 'transparent',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
                    },
                    '.Tab:hover': {
                        backgroundColor: isDark ? 'rgba(100, 116, 139, 0.1)' : 'rgba(71, 85, 105, 0.05)'
                    },
                    '.Tab--selected': {
                        backgroundColor: 'transparent',
                        border: isDark ? '1px solid #64748b' : '1px solid #475569'
                    },
                    // Note: TabIcon doesn't support backgroundColor, removed to prevent warnings
                    '.Block': {
                        backgroundColor: 'transparent'
                    }
                }
            },
        };
    }, [clientSecret, isDark])

    // Create checkout session
    useEffect(() => {
        const createCheckoutSession = async () => {
            try {
                setLoading(true)
                setError(null)

                // Prepare ticket data for checkout
                const tickets = selectedTickets.map(selection => ({
                    ticket_type_id: selection.ticket_type_id,
                    quantity: selection.quantity
                }))

                const checkoutData = {
                    tickets,
                    event_id: eventId,
                    customer_info: customerInfo.email ? {
                        email: customerInfo.email,
                        name: customerInfo.name
                    } : undefined
                }

                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(checkoutData)
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to create checkout session')
                }

                setClientSecret(data.client_secret)
                setOrderDetails(data)

            } catch (err) {
                console.error('Checkout session creation error:', err)
                setError(err instanceof Error ? err.message : 'Failed to create checkout session')
            } finally {
                setLoading(false)
            }
        }

        if (selectedTickets.length > 0) {
            createCheckoutSession()
        }
    }, [selectedTickets, eventId, customerInfo.email, customerInfo.name])

    const handlePaymentSuccess = (paymentId: string) => {
        setPaymentIntentId(paymentId)
    }

    const handleContinue = () => {
        onSuccess(paymentIntentId!)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                    <span className="ml-3 text-muted-foreground">Setting up checkout...</span>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-8">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button
                        onClick={onCancel}
                        variant="outline"
                        className="w-full mt-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tickets
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (paymentIntentId && orderDetails) {
        return (
            <PaymentSuccess
                paymentIntentId={paymentIntentId}
                orderDetails={orderDetails}
                onContinue={handleContinue}
            />
        )
    }

    if (!clientSecret || !orderDetails) {
        return (
            <Card>
                <CardContent className="py-8">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Unable to initialize payment form. Please try again.
                        </AlertDescription>
                    </Alert>
                    <Button
                        onClick={onCancel}
                        variant="outline"
                        className="w-full mt-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tickets
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="w-full lg:max-w-2xl lg:mx-auto">
            {clientSecret && (
                <Elements 
                    stripe={stripePromise} 
                    options={stripeOptions}
                    key={clientSecret} // Force remount when clientSecret changes
                >
                    <PaymentForm
                        orderDetails={orderDetails}
                        customerInfo={customerInfo}
                        onSuccess={handlePaymentSuccess}
                        onCancel={onCancel}
                    />
                </Elements>
            )}
        </div>
    )
} 