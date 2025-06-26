'use client'

import React, { useState } from 'react'
import { LightweightModal } from '@/components/ui/LightweightModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    AlertTriangle,
    Calendar,
    Loader2,
    MapPin,
    Clock,
    DollarSign,
    Ticket,
    CheckCircle2,
    Info
} from 'lucide-react'
import { calculateRefundAmount, formatPrice } from '@/lib/utils/ticket-utils'

interface OrderTicket {
    id: string
    ticket_type: {
        name: string
        price: number
    }
    quantity: number
    confirmation_code: string
}

interface OrderWithTickets {
    id: string
    status: string
    total_amount: number
    created_at: string
    refund_amount: number
    refunded_at: string | null
    is_refundable: boolean
    net_amount: number
    tickets: OrderTicket[]
    event: {
        id: string
        title: string
        start_date: string
        start_time: string
        location_name: string
        status: string
    }
}

interface RefundModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: OrderWithTickets | null
    onRefundSuccess: () => void
}

export default function RefundModal({
    open,
    onOpenChange,
    order,
    onRefundSuccess
}: RefundModalProps) {
    const [step, setStep] = useState<'review' | 'confirm' | 'processing' | 'success'>('review')
    const [refundReason, setRefundReason] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    if (!order) return null

    // Calculate refund details
    const isEventCancelled = order.event.status === 'cancelled'
    const refundType = isEventCancelled ? 'full_cancellation' : 'customer_request'
    const refundCalculation = calculateRefundAmount(order.total_amount, refundType)

    const handleRefundSubmit = async () => {
        if (step !== 'confirm') return

        setIsProcessing(true)
        setStep('processing')

        try {
            const response = await fetch('/api/refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: order.id,
                    refund_type: refundType,
                    reason: refundReason || (isEventCancelled ? 'Event cancelled by organizer' : 'Customer request')
                })
            })

            if (!response.ok) {
                let errorMessage = `Refund failed (${response.status})`
                try {
                    const errorData = await response.json()
                    console.error('Refund API error:', errorData)
                    errorMessage = errorData.error || errorMessage
                } catch (jsonError) {
                    console.error('Failed to parse error response:', jsonError)
                }
                throw new Error(errorMessage)
            }

            // Show success and close modal
            setStep('success')
            setTimeout(() => {
                onRefundSuccess()
                onOpenChange(false)
                resetModal()
            }, 3000)

        } catch (error) {
            console.error('Refund error:', error)
            setErrorMessage(error instanceof Error ? error.message : 'Refund failed')
            setStep('review')
            setIsProcessing(false)
        }
    }

    const resetModal = () => {
        setStep('review')
        setRefundReason('')
        setIsProcessing(false)
        setErrorMessage('')
    }

    const handleClose = (open: boolean) => {
        if (!open) resetModal()
        onOpenChange(open)
    }

    // Success state
    if (step === 'success') {
        return (
            <LightweightModal 
                open={open} 
                onOpenChange={handleClose}
                maxWidth="md"
            >
                <div className="text-center py-8">
                    <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">Refund Processed</h3>
                    <p className="text-muted-foreground">
                        Your refund has been submitted and will appear in your account within 5-10 business days.
                    </p>
                </div>
            </LightweightModal>
        )
    }

    return (
        <LightweightModal 
            open={open} 
            onOpenChange={handleClose}
            title="Request Refund"
            description="Review the refund details below before proceeding."
            maxWidth="2xl"
        >
            <div className="space-y-6">
                {/* Error Message */}
                {errorMessage && (
                    <Alert className="border-destructive/20 bg-destructive/10">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription className="text-destructive">
                            <span className="font-medium">Refund Failed:</span> {errorMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Event Info Card */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border/10">
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-2">{order.event.title}</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(order.event.start_date).toLocaleDateString()} at {order.event.start_time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{order.event.location_name}</span>
                                </div>
                            </div>
                            {isEventCancelled && (
                                <Badge variant="destructive" className="mt-2">
                                    Event Cancelled
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tickets */}
                <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        Tickets to Refund
                    </h4>
                    <div className="space-y-2">
                        {order.tickets.map((ticket) => (
                            <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/10">
                                <div>
                                    <div className="font-medium text-foreground">
                                        {ticket.ticket_type.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Quantity: {ticket.quantity} • {formatPrice(ticket.ticket_type.price)} each
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-foreground">
                                        {formatPrice(ticket.ticket_type.price * ticket.quantity)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Refund Summary */}
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Refund Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Original Amount:</span>
                            <span className="font-medium text-foreground">{formatPrice(order.total_amount)}</span>
                        </div>
                        {!isEventCancelled && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Processing Fee:</span>
                                <span className="font-medium text-destructive">-{formatPrice(refundCalculation.stripeFee)}</span>
                            </div>
                        )}
                        <div className="border-t border-border/10 pt-2 flex justify-between font-semibold">
                            <span className="text-foreground">Refund Amount:</span>
                            <span className="text-green-600 dark:text-green-400">{formatPrice(refundCalculation.netRefund)}</span>
                        </div>
                    </div>
                </div>

                {/* Policy Info */}
                <Alert className="border-yellow-500/20 bg-yellow-500/10">
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                        <span className="font-medium">Refund Policy:</span> {' '}
                        {isEventCancelled ? (
                            "Since this event was cancelled, you're eligible for a full refund with no processing fees."
                        ) : (
                            "Customer-requested refunds are subject to a $0.30 processing fee. Refunds typically take 5-10 business days."
                        )}
                    </AlertDescription>
                </Alert>

                {/* Reason (for customer requests) */}
                {!isEventCancelled && step === 'review' && (
                    <div>
                        <label htmlFor="refund-reason" className="block text-sm font-medium text-foreground mb-2">
                            Reason for Refund (Optional)
                        </label>
                        <textarea
                            id="refund-reason"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Please let us know why you're requesting a refund..."
                            className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none"
                            rows={3}
                            maxLength={500}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                            {refundReason.length}/500 characters
                        </div>
                    </div>
                )}

                {/* Confirmation step */}
                {step === 'confirm' && (
                    <Alert className="border-destructive/20 bg-destructive/10">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription className="text-destructive">
                            <span className="font-medium">Confirm Refund:</span> This action cannot be undone. Your refund of {formatPrice(refundCalculation.netRefund)} will be processed immediately.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border/10">
                    {step === 'review' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    setErrorMessage('')
                                    setStep('confirm')
                                }}
                                className="flex-1"
                            >
                                Continue
                            </Button>
                        </>
                    )}

                    {step === 'confirm' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep('review')}
                                disabled={isProcessing}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleRefundSubmit}
                                disabled={isProcessing}
                                variant="destructive"
                                className="flex-1"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm Refund'
                                )}
                            </Button>
                        </>
                    )}

                    {step === 'processing' && (
                        <div className="flex items-center justify-center py-2 w-full">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-muted-foreground">Processing your refund...</span>
                        </div>
                    )}
                </div>
            </div>
        </LightweightModal>
    )
}