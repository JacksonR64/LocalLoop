'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
    formatPrice,
    validateTicketPrice,
    calculateCustomerTotal,
    sortTicketTypes,
    formatSaleDate
} from '@/lib/utils/ticket-utils'
import type { TicketType, CreateTicketTypePayload, UpdateTicketTypePayload } from '@/lib/types/ticket'
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    DollarSign,
    Users,
    Calendar,
    AlertCircle,
    Info
} from 'lucide-react'

interface TicketTypeManagerProps {
    eventId: string
    isOrganizer: boolean
}

interface TicketFormData {
    name: string
    description: string
    price: string // Keep as string for input handling
    capacity: string
    sale_start: string
    sale_end: string
}

const initialFormData: TicketFormData = {
    name: '',
    description: '',
    price: '',
    capacity: '',
    sale_start: '',
    sale_end: ''
}

export default function TicketTypeManager({ eventId, isOrganizer }: TicketTypeManagerProps) {
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState<TicketFormData>(initialFormData)
    const [error, setError] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // Load ticket types
    useEffect(() => {
        const loadTicketTypes = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch(`/api/ticket-types?event_id=${eventId}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to load ticket types')
                }

                const sortedTickets = sortTicketTypes(data.ticket_types)
                setTicketTypes(sortedTickets)

            } catch (err) {
                console.error('Error loading ticket types:', err)
                setError(err instanceof Error ? err.message : 'Failed to load ticket types')
            } finally {
                setLoading(false)
            }
        }

        if (eventId) {
            loadTicketTypes()
        }
    }, [eventId])

    const validateForm = (data: TicketFormData): Record<string, string> => {
        const errors: Record<string, string> = {}

        // Name validation
        if (!data.name.trim()) {
            errors.name = 'Ticket type name is required'
        } else if (data.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters'
        }

        // Price validation
        const price = parseFloat(data.price) || 0
        const priceInCents = Math.round(price * 100)
        const priceValidation = validateTicketPrice(priceInCents)
        if (!priceValidation.isValid) {
            errors.price = priceValidation.error!
        }

        // Capacity validation
        if (data.capacity) {
            const capacity = parseInt(data.capacity)
            if (capacity < 1) {
                errors.capacity = 'Capacity must be at least 1'
            } else if (capacity > 1000) {
                errors.capacity = 'Capacity cannot exceed 1000'
            }
        }

        // Date validation
        if (data.sale_start && data.sale_end) {
            const startDate = new Date(data.sale_start)
            const endDate = new Date(data.sale_end)
            if (startDate >= endDate) {
                errors.sale_end = 'Sale end date must be after start date'
            }
        }

        return errors
    }

    const resetForm = () => {
        setFormData(initialFormData)
        setValidationErrors({})
        setEditingId(null)
        setShowCreateForm(false)
    }

    const handleEdit = (ticketType: TicketType) => {
        setEditingId(ticketType.id)
        setShowCreateForm(false)
        setFormData({
            name: ticketType.name,
            description: ticketType.description || '',
            price: (ticketType.price / 100).toString(),
            capacity: ticketType.capacity?.toString() || '',
            sale_start: ticketType.sale_start || '',
            sale_end: ticketType.sale_end || ''
        })
        setValidationErrors({})
    }

    const handleCreate = () => {
        setShowCreateForm(true)
        setEditingId(null)
        setFormData(initialFormData)
        setValidationErrors({})
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)

            // Validate form
            const errors = validateForm(formData)
            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors)
                return
            }

            // Prepare payload
            const priceValue = parseFloat(formData.price) || 0
            const priceInCents = Math.round(priceValue * 100)

            // Validate that price conversion resulted in a valid number
            if (isNaN(priceInCents) || priceInCents < 0) {
                setError('Please enter a valid price')
                return
            }

            let response: Response
            if (editingId) {
                // Update existing ticket type - don't include event_id in PATCH
                const patchPayload = {
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    price: priceInCents,
                    capacity: formData.capacity ? parseInt(formData.capacity) : 1000,
                    sale_start: formData.sale_start.trim() || null,
                    sale_end: formData.sale_end.trim() || null
                }
                response = await fetch(`/api/ticket-types/${editingId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patchPayload as UpdateTicketTypePayload)
                })
            } else {
                // Create new ticket type - include event_id for POST
                const postPayload = {
                    event_id: eventId,
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    price: priceInCents,
                    capacity: formData.capacity ? parseInt(formData.capacity) : 1000,
                    sale_start: formData.sale_start.trim() || null,
                    sale_end: formData.sale_end.trim() || null
                }
                response = await fetch('/api/ticket-types', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postPayload as CreateTicketTypePayload)
                })
            }

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save ticket type')
            }

            // Update local state
            if (editingId) {
                setTicketTypes(prev => prev.map(t => t.id === editingId ? data.ticket_type : t))
            } else {
                setTicketTypes(prev => sortTicketTypes([...prev, data.ticket_type]))
            }

            resetForm()

        } catch (err) {
            console.error('Error saving ticket type:', err)
            setError(err instanceof Error ? err.message : 'Failed to save ticket type')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (ticketTypeId: string) => {
        if (!confirm('Are you sure you want to delete this ticket type?')) {
            return
        }

        try {
            setSaving(true)
            setError(null)

            const response = await fetch(`/api/ticket-types/${ticketTypeId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete ticket type')
            }

            setTicketTypes(prev => prev.filter(t => t.id !== ticketTypeId))

        } catch (err) {
            console.error('Error deleting ticket type:', err)
            setError(err instanceof Error ? err.message : 'Failed to delete ticket type')
        } finally {
            setSaving(false)
        }
    }

    const getPriceWithFees = (priceInCents: number): number => {
        return calculateCustomerTotal(priceInCents)
    }

    if (!isOrganizer) {
        return null
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Ticket Types Management
                        </CardTitle>
                        <Button onClick={handleCreate} disabled={saving}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Ticket Type
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Create/Edit Form */}
                    {(showCreateForm || editingId) && (
                        <Card className="mb-6 border-2 border-blue-200">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {editingId ? 'Edit Ticket Type' : 'Create New Ticket Type'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="ticket-name" className="block text-sm font-medium mb-1">
                                            Ticket Name *
                                        </label>
                                        <Input
                                            id="ticket-name"
                                            name="ticket-name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., General Admission"
                                            className={validationErrors.name ? 'border-red-500' : ''}
                                            aria-describedby={validationErrors.name ? 'name-error' : undefined}
                                        />
                                        {validationErrors.name && (
                                            <p id="name-error" className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="ticket-price" className="block text-sm font-medium mb-1">
                                            Price ($) *
                                        </label>
                                        <Input
                                            id="ticket-price"
                                            name="ticket-price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="0.00"
                                            className={validationErrors.price ? 'border-red-500' : ''}
                                            aria-describedby={validationErrors.price ? 'price-error' : 'price-help'}
                                        />
                                        {validationErrors.price && (
                                            <p id="price-error" className="text-red-500 text-sm mt-1">{validationErrors.price}</p>
                                        )}
                                        {formData.price && !validationErrors.price && (
                                            <p id="price-help" className="text-gray-500 text-sm mt-1">
                                                Customer pays: {formatPrice(getPriceWithFees(Math.round((parseFloat(formData.price) || 0) * 100)))}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="ticket-capacity" className="block text-sm font-medium mb-1">
                                            Capacity (optional)
                                        </label>
                                        <Input
                                            id="ticket-capacity"
                                            name="ticket-capacity"
                                            type="number"
                                            min="1"
                                            max="1000"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                                            placeholder="1000 (default)"
                                            className={validationErrors.capacity ? 'border-red-500' : ''}
                                            aria-describedby={validationErrors.capacity ? 'capacity-error' : 'capacity-help'}
                                        />
                                        {validationErrors.capacity && (
                                            <p id="capacity-error" className="text-red-500 text-sm mt-1">{validationErrors.capacity}</p>
                                        )}
                                        <p id="capacity-help" className="text-gray-500 text-xs mt-1">
                                            If blank, defaults to 1000 tickets maximum
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="sale-start" className="block text-sm font-medium mb-1">
                                            Sale Start Date (optional)
                                        </label>
                                        <Input
                                            id="sale-start"
                                            name="sale-start"
                                            type="datetime-local"
                                            value={formData.sale_start}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sale_start: e.target.value }))}
                                            aria-describedby="sale-start-help"
                                        />
                                        <p id="sale-start-help" className="text-gray-500 text-xs mt-1">
                                            If blank, tickets can be purchased immediately
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label htmlFor="sale-end" className="block text-sm font-medium mb-1">
                                            Sale End Date (optional)
                                        </label>
                                        <Input
                                            id="sale-end"
                                            name="sale-end"
                                            type="datetime-local"
                                            value={formData.sale_end}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sale_end: e.target.value }))}
                                            className={validationErrors.sale_end ? 'border-red-500' : ''}
                                            aria-describedby={validationErrors.sale_end ? 'sale-end-error' : 'sale-end-help'}
                                        />
                                        {validationErrors.sale_end && (
                                            <p id="sale-end-error" className="text-red-500 text-sm mt-1">{validationErrors.sale_end}</p>
                                        )}
                                        <p id="sale-end-help" className="text-gray-500 text-xs mt-1">
                                            If blank, tickets remain available until the event starts
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label htmlFor="ticket-description" className="block text-sm font-medium mb-1">
                                            Description (optional)
                                        </label>
                                        <Textarea
                                            id="ticket-description"
                                            name="ticket-description"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Additional details about this ticket type..."
                                            rows={3}
                                            aria-label="Description for this ticket type"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleSave} disabled={saving}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                                    </Button>
                                    <Button variant="outline" onClick={resetForm} disabled={saving}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Ticket Types List */}
                    {ticketTypes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No ticket types created yet.</p>
                            <p className="text-sm">Click &quot;Add Ticket Type&quot; to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ticketTypes.map((ticketType) => (
                                <Card key={ticketType.id} className="border">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-lg">{ticketType.name}</h4>
                                                    <Badge variant="outline">
                                                        {formatPrice(ticketType.price)}
                                                    </Badge>
                                                    {ticketType.capacity && (
                                                        <Badge variant="secondary" className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {ticketType.capacity} max
                                                        </Badge>
                                                    )}
                                                </div>

                                                {ticketType.description && (
                                                    <p className="text-gray-600 text-sm mb-2">{ticketType.description}</p>
                                                )}

                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>Customer pays: {formatPrice(getPriceWithFees(ticketType.price))}</span>

                                                    {(ticketType.sale_start || ticketType.sale_end) && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {ticketType.sale_start && (
                                                                <>Starts: {formatSaleDate(ticketType.sale_start)}</>
                                                            )}
                                                            {ticketType.sale_start && ticketType.sale_end && ' | '}
                                                            {ticketType.sale_end && (
                                                                <>Ends: {formatSaleDate(ticketType.sale_end)}</>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(ticketType)}
                                                    disabled={saving}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(ticketType.id)}
                                                    disabled={saving}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Info Box */}
                    <Alert className="mt-6">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Pricing Note:</strong> Prices are automatically calculated to include Stripe processing fees.
                            The amount you set is what you&apos;ll receive, and customers will pay a slightly higher amount to cover fees.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    )
} 