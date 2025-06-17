'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    AlertTriangle,
    Calendar,
    Loader2,
    MapPin,
    Clock,
    DollarSign,
    Ticket,
    CheckCircle2
} from 'lucide-react'
import { calculateRefundAmount } from '@/lib/utils/ticket-utils'

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

interface RefundDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: OrderWithTickets | null
    onRefundSuccess: () => void
}

export default function RefundDialog({
    open,
    onOpenChange,
    order,
    onRefundSuccess
}: RefundDialogProps) {
    const [step, setStep] = useState<'review' | 'confirm' | 'processing' | 'success'>('review')
    const [refundReason, setRefundReason] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    if (!order) return null

    // Calculate refund details
    const isEventCancelled = order.event.status === 'cancelled'
    const refundType = isEventCancelled ? 'full_cancellation' : 'customer_request'

    // Calculate refund amounts
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
                throw new Error('Refund failed')
            }

            // Show success and close dialog
            setStep('success')
            setTimeout(() => {
                onRefundSuccess()
                onOpenChange(false)
                resetDialog()
            }, 3000)

        } catch (error) {
            console.error('Refund error:', error)
            // Reset to review step on error
            setStep('review')
            setIsProcessing(false)
        }
    }

    const resetDialog = () => {
        setStep('review')
        setRefundReason('')
        setIsProcessing(false)
    }

    // Success state
    if (step === 'success') {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <div className="text-center py-6">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Refund Processed</h3>
                        <p className="text-muted-foreground">Your refund has been submitted and will appear in your account within 5-10 business days.</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) resetDialog()
            onOpenChange(open)
        }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Request Refund
                    </DialogTitle>
                    <DialogDescription>
                        Review the refund details below before proceeding.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Event Details */}
                    <div className="bg-muted rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2">{order.event.title}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(order.event.start_date).toLocaleDateString()}</span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{order.event.start_time}</span>
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

                    {/* Tickets */}
                    <div>
                        <h4 className="font-medium text-foreground mb-3">Tickets to Refund</h4>
                        <div className="space-y-2">
                            {order.tickets.map((ticket) => (
                                <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Ticket className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {ticket.ticket_type.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Quantity: {ticket.quantity} • ${ticket.ticket_type.price.toFixed(2)} each
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-foreground">
                                            ${(ticket.ticket_type.price * ticket.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Refund Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Refund Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Original Amount:</span>
                                <span className="font-medium">${order.total_amount.toFixed(2)}</span>
                            </div>
                            {!isEventCancelled && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Processing Fee:</span>
                                    <span className="font-medium text-red-600">-${refundCalculation.stripeFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t pt-2 flex justify-between font-semibold">
                                <span>Refund Amount:</span>
                                <span className="text-green-600">${refundCalculation.netRefund.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Refund Policy */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <div className="font-medium text-amber-800 mb-1">Refund Policy</div>
                                <div className="text-amber-700">
                                    {isEventCancelled ? (
                                        "Since this event was cancelled, you're eligible for a full refund with no processing fees."
                                    ) : (
                                        "Customer-requested refunds are subject to a $0.30 processing fee. Refunds typically take 5-10 business days to appear in your account."
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reason (for customer requests) */}
                    {!isEventCancelled && step === 'review' && (
                        <div>
                            <label htmlFor="refund-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Refund (Optional)
                            </label>
                            <textarea
                                id="refund-reason"
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Please let us know why you're requesting a refund..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                maxLength={500}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {refundReason.length}/500 characters
                            </div>
                        </div>
                    )}

                    {/* Confirmation step */}
                    {step === 'confirm' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <div className="font-medium text-red-800 mb-1">Confirm Refund</div>
                                    <div className="text-red-700">
                                        This action cannot be undone. Your refund of ${refundCalculation.netRefund.toFixed(2)} will be processed immediately.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    {step === 'review' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => setStep('confirm')}
                                className="bg-blue-600 hover:bg-blue-700"
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
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleRefundSubmit}
                                disabled={isProcessing}
                                className="bg-red-600 hover:bg-red-700"
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
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-gray-600">Processing your refund...</span>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 