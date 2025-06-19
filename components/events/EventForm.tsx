'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import TicketTypeManager from '@/components/events/TicketTypeManager'
import {
    Calendar,
    MapPin,
    DollarSign,
    Users,
    Camera,
    Globe,
    Hash,
    FileText,
    AlertCircle,
    Save,
    X,
    Plus,
    Eye,
    EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventFormData {
    title: string
    slug: string
    description: string
    short_description: string
    start_time: string
    end_time: string
    timezone: string
    location: string
    location_details: string
    latitude: string
    longitude: string
    is_online: boolean
    online_url: string
    category: string
    tags: string[]
    capacity: string
    is_paid: boolean
    image_url: string
    image_alt_text: string
    featured: boolean
    published: boolean
}

interface EventFormProps {
    eventId?: string
    isEdit?: boolean
    onSuccess?: (eventId: string) => void
    onCancel?: () => void
}

const CATEGORIES = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'social', label: 'Social' },
    { value: 'arts', label: 'Arts & Culture' },
    { value: 'sports', label: 'Sports & Recreation' },
    { value: 'family', label: 'Family' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' }
]

const TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'UTC', label: 'UTC' }
]

const initialFormData: EventFormData = {
    title: '',
    slug: '',
    description: '',
    short_description: '',
    start_time: '',
    end_time: '',
    timezone: 'UTC',
    location: '',
    location_details: '',
    latitude: '',
    longitude: '',
    is_online: false,
    online_url: '',
    category: 'social',
    tags: [],
    capacity: '',
    is_paid: false,
    image_url: '',
    image_alt_text: '',
    featured: false,
    published: true
}

export default function EventForm({ eventId, isEdit = false, onSuccess, onCancel }: EventFormProps) {
    const router = useRouter()
    const [formData, setFormData] = useState<EventFormData>(initialFormData)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [tagInput, setTagInput] = useState('')
    const [showPreview, setShowPreview] = useState(false)

    // Load event data for editing
    const loadEventData = useCallback(async () => {
        if (!eventId) return

        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/events/${eventId}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load event')
            }

            // Map event data to form data
            const event = data.event
            setFormData({
                title: event.title || '',
                slug: event.slug || '',
                description: event.description || '',
                short_description: event.short_description || '',
                start_time: event.start_time ? formatDateForInput(event.start_time) : '',
                end_time: event.end_time ? formatDateForInput(event.end_time) : '',
                timezone: event.timezone || 'UTC',
                location: event.location || '',
                location_details: event.location_details || '',
                latitude: event.latitude?.toString() || '',
                longitude: event.longitude?.toString() || '',
                is_online: event.is_online || false,
                online_url: event.online_url || '',
                category: event.category || 'social',
                tags: event.tags || [],
                capacity: event.capacity?.toString() || '',
                is_paid: event.is_paid || false,
                image_url: event.image_url || '',
                image_alt_text: event.image_alt_text || '',
                featured: event.featured || false,
                published: event.published !== false
            })

        } catch (err) {
            console.error('Error loading event:', err)
            setError(err instanceof Error ? err.message : 'Failed to load event')
        } finally {
            setLoading(false)
        }
    }, [eventId])

    useEffect(() => {
        if (isEdit && eventId) {
            loadEventData()
        }
    }, [isEdit, eventId, loadEventData])

    const formatDateForInput = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM format
    }

    const generateSlug = (title: string): string => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
    }

    const handleInputChange = (field: keyof EventFormData, value: string | boolean | string[]) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value }

            // Auto-generate slug from title
            if (field === 'title' && !isEdit && typeof value === 'string') {
                updated.slug = generateSlug(value)
            }

            // Auto-generate alt text from title
            if (field === 'title' && updated.image_url && !updated.image_alt_text && typeof value === 'string') {
                updated.image_alt_text = `${value} event image`
            }

            return updated
        })

        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [field]: _, ...rest } = prev
                return rest
            })
        }
    }

    const handleTagAdd = () => {
        const tag = tagInput.trim().toLowerCase()
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }))
            setTagInput('')
        }
    }

    const handleTagRemove = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const validateForm = (): Record<string, string> => {
        const errors: Record<string, string> = {}

        // Required fields
        if (!formData.title.trim()) {
            errors.title = 'Event title is required'
        }

        if (!formData.slug.trim()) {
            errors.slug = 'Event slug is required'
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
        }

        if (!formData.description.trim()) {
            errors.description = 'Event description is required'
        }

        if (!formData.start_time) {
            errors.start_time = 'Start time is required'
        }

        if (!formData.end_time) {
            errors.end_time = 'End time is required'
        }

        // Date validation
        if (formData.start_time && formData.end_time) {
            const startDate = new Date(formData.start_time)
            const endDate = new Date(formData.end_time)

            if (startDate >= endDate) {
                errors.end_time = 'End time must be after start time'
            }

            if (!isEdit && startDate <= new Date()) {
                errors.start_time = 'Start time must be in the future'
            }
        }

        // Location validation
        if (!formData.is_online && !formData.location.trim()) {
            errors.location = 'Location is required for in-person events'
        }

        if (formData.is_online && !formData.online_url.trim()) {
            errors.online_url = 'Online URL is required for virtual events'
        }

        // Capacity validation
        if (formData.capacity && parseInt(formData.capacity) < 1) {
            errors.capacity = 'Capacity must be at least 1'
        }

        // Coordinates validation
        if (formData.latitude && (isNaN(parseFloat(formData.latitude)) || Math.abs(parseFloat(formData.latitude)) > 90)) {
            errors.latitude = 'Latitude must be between -90 and 90'
        }

        if (formData.longitude && (isNaN(parseFloat(formData.longitude)) || Math.abs(parseFloat(formData.longitude)) > 180)) {
            errors.longitude = 'Longitude must be between -180 and 180'
        }

        return errors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (saving) return

        setSaving(true)
        setError(null)

        try {
            // Validate form
            const errors = validateForm()
            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors)
                return
            }

            // Prepare payload
            const payload = {
                title: formData.title.trim(),
                slug: formData.slug.trim(),
                description: formData.description.trim(),
                short_description: formData.short_description.trim() || null,
                start_time: new Date(formData.start_time).toISOString(),
                end_time: new Date(formData.end_time).toISOString(),
                timezone: formData.timezone,
                location: formData.location.trim() || null,
                location_details: formData.location_details.trim() || null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                is_online: formData.is_online,
                online_url: formData.online_url.trim() || null,
                category: formData.category,
                tags: formData.tags,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                is_paid: formData.is_paid,
                image_url: formData.image_url.trim() || null,
                image_alt_text: formData.image_alt_text.trim() || null,
                featured: formData.featured,
                published: formData.published
            }

            let response: Response
            if (isEdit && eventId) {
                response = await fetch(`/api/events/${eventId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            } else {
                response = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save event')
            }

            // Success
            const savedEventId = data.event.id
            if (onSuccess) {
                onSuccess(savedEventId)
            } else {
                router.push(`/events/${savedEventId}`)
            }

        } catch (err) {
            console.error('Error saving event:', err)
            setError(err instanceof Error ? err.message : 'Failed to save event')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <LoadingSpinner />
                <span className="ml-3">Loading event...</span>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Edit Event' : 'Create New Event'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {isEdit ? 'Update your event details below' : 'Fill in the details below to create your event'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2"
                    >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label htmlFor="title">Event Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    placeholder="Enter a compelling event title"
                                    className={cn(validationErrors.title && 'border-red-500')}
                                />
                                {validationErrors.title && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                                )}
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-gray-500 text-sm">
                                        Keep it concise and engaging
                                    </p>
                                    <p className={cn(
                                        "text-sm",
                                        formData.title.length > 60 ? "text-orange-600 font-medium" : "text-gray-400"
                                    )}>
                                        {formData.title.length}/60
                                    </p>
                                </div>
                                {formData.title.length > 60 && (
                                    <p className="text-orange-600 text-sm mt-1">
                                        Consider shortening your title for better display in event cards and search results
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="slug">URL Slug *</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    placeholder="event-url-slug"
                                    className={cn(validationErrors.slug && 'border-red-500')}
                                />
                                {validationErrors.slug && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.slug}</p>
                                )}
                                <p className="text-gray-500 text-sm mt-1">
                                    This will be part of your event URL
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(category => (
                                            <SelectItem key={category.value} value={category.value}>
                                                {category.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="short_description">Short Description</Label>
                                <Input
                                    id="short_description"
                                    value={formData.short_description}
                                    onChange={(e) => handleInputChange('short_description', e.target.value)}
                                    placeholder="Brief one-line description (optional)"
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-gray-500 text-sm">
                                        This appears in event listings and search results
                                    </p>
                                    <p className={cn(
                                        "text-sm",
                                        formData.short_description.length > 120 ? "text-orange-600 font-medium" : "text-gray-400"
                                    )}>
                                        {formData.short_description.length}/120
                                    </p>
                                </div>
                                {formData.short_description.length > 120 && (
                                    <p className="text-orange-600 text-sm mt-1">
                                        Consider shortening your description - it may be truncated in event listings
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="description">Full Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Provide detailed information about your event..."
                                    rows={6}
                                    className={cn(validationErrors.description && 'border-red-500')}
                                />
                                {validationErrors.description && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Date & Time */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Date & Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="start_time">Start Date & Time *</Label>
                                <Input
                                    id="start_time"
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                                    className={cn(validationErrors.start_time && 'border-red-500')}
                                />
                                {validationErrors.start_time && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.start_time}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="end_time">End Date & Time *</Label>
                                <Input
                                    id="end_time"
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                                    className={cn(validationErrors.end_time && 'border-red-500')}
                                />
                                {validationErrors.end_time && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.end_time}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="timezone">Timezone</Label>
                                <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONES.map(tz => (
                                            <SelectItem key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_online"
                                checked={formData.is_online}
                                onCheckedChange={(checked) => handleInputChange('is_online', checked)}
                            />
                            <Label htmlFor="is_online">This is an online event</Label>
                        </div>

                        {formData.is_online ? (
                            <div>
                                <Label htmlFor="online_url">Online Event URL *</Label>
                                <Input
                                    id="online_url"
                                    type="url"
                                    value={formData.online_url}
                                    onChange={(e) => handleInputChange('online_url', e.target.value)}
                                    placeholder="https://zoom.us/j/123456789"
                                    className={cn(validationErrors.online_url && 'border-red-500')}
                                />
                                {validationErrors.online_url && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.online_url}</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="location">Venue/Location *</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        placeholder="Venue name or address"
                                        className={cn(validationErrors.location && 'border-red-500')}
                                    />
                                    {validationErrors.location && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="location_details">Location Details</Label>
                                    <Textarea
                                        id="location_details"
                                        value={formData.location_details}
                                        onChange={(e) => handleInputChange('location_details', e.target.value)}
                                        placeholder="Additional location details, directions, parking info..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="latitude">Latitude (optional)</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            value={formData.latitude}
                                            onChange={(e) => handleInputChange('latitude', e.target.value)}
                                            placeholder="40.7128"
                                            className={cn(validationErrors.latitude && 'border-red-500')}
                                        />
                                        {validationErrors.latitude && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.latitude}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="longitude">Longitude (optional)</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            value={formData.longitude}
                                            onChange={(e) => handleInputChange('longitude', e.target.value)}
                                            placeholder="-74.0060"
                                            className={cn(validationErrors.longitude && 'border-red-500')}
                                        />
                                        {validationErrors.longitude && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.longitude}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Capacity & Tickets */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Capacity & Ticketing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="capacity">Event Capacity</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    min="1"
                                    value={formData.capacity}
                                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                    className={cn(validationErrors.capacity && 'border-red-500')}
                                />
                                {validationErrors.capacity && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.capacity}</p>
                                )}
                                <p className="text-gray-500 text-sm mt-1">
                                    Maximum number of attendees (leave empty for unlimited)
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_paid"
                                    checked={formData.is_paid}
                                    onCheckedChange={(checked) => handleInputChange('is_paid', checked)}
                                />
                                <Label htmlFor="is_paid">This is a paid event</Label>
                            </div>
                        </div>

                        {formData.is_paid && (
                            <Alert className="border-blue-200 bg-blue-50">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-600">
                                    You can configure ticket types and pricing after saving the event.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Media & Presentation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Media & Presentation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="image_url">Event Image URL</Label>
                                <Input
                                    id="image_url"
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                                    placeholder="https://example.com/event-image.jpg"
                                />
                                <p className="text-gray-500 text-sm mt-1">
                                    URL to an image that represents your event
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="image_alt_text">Image Alt Text</Label>
                                <Input
                                    id="image_alt_text"
                                    value={formData.image_alt_text}
                                    onChange={(e) => handleInputChange('image_alt_text', e.target.value)}
                                    placeholder="Describe the image for accessibility"
                                />
                                <p className="text-gray-500 text-sm mt-1">
                                    Describe the image for accessibility
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleTagRemove(tag)}
                                            className="ml-1 hover:text-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Add a tag"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleTagAdd()
                                        }
                                    }}
                                />
                                <Button type="button" onClick={handleTagAdd} variant="outline">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                                Add tags to help people find your event
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Publishing Options */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Publishing Options
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="published"
                                checked={formData.published}
                                onCheckedChange={(checked) => handleInputChange('published', checked)}
                            />
                            <Label htmlFor="published">Publish event (make it visible to the public)</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="featured"
                                checked={formData.featured}
                                onCheckedChange={(checked) => handleInputChange('featured', checked)}
                            />
                            <Label htmlFor="featured">Feature this event (appears in featured section)</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel || (() => router.back())}
                        disabled={saving}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>

                    <Button type="submit" disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
                    </Button>
                </div>
            </form>

            {/* Ticket Type Management for Existing Paid Events */}
            {isEdit && eventId && formData.is_paid && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Ticket Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TicketTypeManager eventId={eventId} isOrganizer={true} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 