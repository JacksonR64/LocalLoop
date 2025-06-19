'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Checkbox } from '@/components/ui/checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Search,
    Download,
    UserCheck,
    MoreHorizontal,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    Users,
    DollarSign,
    CalendarDays,
    MapPin,
    Mail,
} from 'lucide-react'
import { format } from 'date-fns'
import { formatPrice } from '@/lib/utils/ticket-utils'

interface Attendee {
    id: string
    type: 'ticket' | 'rsvp'
    name: string
    email: string
    eventId: string
    eventTitle: string
    eventStartTime: string
    eventLocation: string
    status: string
    checkedInAt: string | null
    createdAt: string
    ticketType: string
    ticketPrice: number
    confirmationCode: string | null
    orderId: string | null
    orderTotal: number | null
    orderStatus: string | null
    userId: string | null
    rsvpId?: string
    attendeeCount: number
}

interface AttendeeSummary {
    totalAttendees: number
    checkedInCount: number
    ticketHolders: number
    rsvpAttendees: number
    totalRevenue: number
    checkInRate: number
}

interface AttendeesResponse {
    attendees: Attendee[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
    }
    summary: AttendeeSummary
}

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined, formatString: string = 'MMM d, yyyy'): string => {
    if (!dateString) return 'N/A'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return 'N/A'
        return format(date, formatString)
    } catch {
        return 'N/A'
    }
}

export default function AttendeeManagement() {
    const [attendees, setAttendees] = useState<Attendee[]>([])
    const [summary, setSummary] = useState<AttendeeSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set())

    // Filters and search
    const [search, setSearch] = useState('')
    const [eventFilter, setEventFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [checkedInFilter, setCheckedInFilter] = useState('all')
    const [sortBy] = useState('created_at')
    const [sortOrder] = useState<'asc' | 'desc'>('desc')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false
    })

    // Available events for filtering
    const [events, setEvents] = useState<Array<{ id: string, title: string }>>([])

    const fetchAttendees = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '50',
                sort_by: sortBy,
                sort_order: sortOrder,
            })

            if (search) params.append('search', search)
            if (eventFilter !== 'all') params.append('event_id', eventFilter)
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (checkedInFilter !== 'all') params.append('checked_in', checkedInFilter)

            const response = await fetch(`/api/staff/attendees?${params}`)

            if (!response.ok) {
                throw new Error('Failed to fetch attendees')
            }

            const data: AttendeesResponse = await response.json()
            setAttendees(data.attendees)
            setSummary(data.summary)
            setPagination(data.pagination)

            // Extract unique events for filter dropdown
            const uniqueEvents = Array.from(
                new Map(
                    data.attendees
                        .filter(a => a.eventId && a.eventTitle) // Only include attendees with valid event data
                        .map(a => [a.eventId, { id: a.eventId, title: a.eventTitle }])
                ).values()
            )
            setEvents(uniqueEvents)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch attendees')
        } finally {
            setLoading(false)
        }
    }, [currentPage, search, eventFilter, statusFilter, checkedInFilter, sortBy, sortOrder])

    useEffect(() => {
        fetchAttendees()
    }, [fetchAttendees])

    const handleSelectAttendee = (attendeeId: string, checked: boolean) => {
        const newSelected = new Set(selectedAttendees)
        if (checked) {
            newSelected.add(attendeeId)
        } else {
            newSelected.delete(attendeeId)
        }
        setSelectedAttendees(newSelected)
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAttendees(new Set(attendees.map(a => a.id)))
        } else {
            setSelectedAttendees(new Set())
        }
    }

    const handleBulkAction = async (action: 'email' | 'export' | 'checkin') => {
        if (selectedAttendees.size === 0) return

        try {
            switch (action) {
                case 'email':
                    // TODO: Implement bulk email functionality
                    alert(`Sending email to ${selectedAttendees.size} attendees`)
                    break
                case 'export':
                    await handleExportAttendees(true) // Export selected only
                    break
                case 'checkin':
                    // TODO: Implement bulk check-in
                    alert(`Checking in ${selectedAttendees.size} attendees`)
                    break
            }
        } catch (err) {
            console.error(`Failed to ${action}:`, err)
        }
    }

    const handleExportAttendees = async (selectedOnly: boolean = false) => {
        try {
            // Prepare filters for export
            const filters: Record<string, string> = {}

            if (eventFilter !== 'all') filters.eventId = eventFilter
            if (statusFilter !== 'all') filters.status = statusFilter
            if (checkedInFilter !== 'all') filters.checkedIn = checkedInFilter
            if (search) filters.search = search

            // If exporting selected only, we'll filter the current attendees data
            // If exporting selected only, we'll filter the current attendees data

            // Call the export API
            const response = await fetch('/api/staff/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'attendees',
                    filters: selectedOnly ? {} : filters, // Use current filters if exporting all
                    options: {
                        selectedOnly,
                        selectedIds: selectedOnly ? Array.from(selectedAttendees) : undefined
                    }
                })
            })

            if (!response.ok) {
                throw new Error('Failed to export attendees')
            }

            // Get the CSV content and trigger download
            const csvContent = await response.text()
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `attendees-export-${selectedOnly ? 'selected-' : ''}${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            // Clear selection after export
            if (selectedOnly) {
                setSelectedAttendees(new Set())
            }

        } catch (error) {
            console.error('Export failed:', error)
            alert('Failed to export attendees. Please try again.')
        }
    }

    const getStatusBadge = (status: string) => {
        const statusColors = {
            active: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            confirmed: 'bg-blue-100 text-blue-800',
            pending: 'bg-yellow-100 text-yellow-800',
        }

        return (
            <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-muted text-muted-foreground'}>
                {status}
            </Badge>
        )
    }

    const getTypeBadge = (type: 'ticket' | 'rsvp') => {
        return type === 'ticket' ? (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <DollarSign className="w-3 h-3 mr-1" />
                Paid
            </Badge>
        ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Free
            </Badge>
        )
    }

    if (loading && attendees.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading attendees...</span>
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-red-600">
                        <XCircle className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg font-medium">Error loading attendees</p>
                        <p className="text-sm">{error}</p>
                        <Button onClick={fetchAttendees} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalAttendees}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.checkedInCount}</div>
                            <p className="text-xs text-muted-foreground">
                                {summary.checkInRate.toFixed(1)}% check-in rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ticket Holders</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.ticketHolders}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatPrice(summary.totalRevenue)} revenue
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">RSVP Attendees</CardTitle>
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.rsvpAttendees}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Search */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search attendees, events, or confirmation codes..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Select value={eventFilter} onValueChange={setEventFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Events" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    {events.map((event, index) => (
                                        <SelectItem key={event.id || `event-${index}`} value={event.id}>
                                            {event.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={checkedInFilter} onValueChange={setCheckedInFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Check-in" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="true">Checked In</SelectItem>
                                    <SelectItem value="false">Not Checked In</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={fetchAttendees}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleExportAttendees(false)}
                                disabled={loading}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export All
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Bulk Actions */}
            {selectedAttendees.size > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                {selectedAttendees.size} attendee(s) selected
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction('email')}
                                >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction('export')}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction('checkin')}
                                >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Check In
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Attendees Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendees</CardTitle>
                    <CardDescription>
                        Manage all event attendees across tickets and RSVPs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={attendees.length > 0 && selectedAttendees.size === attendees.length}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Check-in</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendees.map((attendee) => (
                                    <TableRow key={attendee.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedAttendees.has(attendee.id)}
                                                onCheckedChange={(checked) =>
                                                    handleSelectAttendee(attendee.id, checked as boolean)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {attendee.name}
                                            {attendee.confirmationCode && (
                                                <div className="text-xs text-muted-foreground">
                                                    {attendee.confirmationCode}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{attendee.email}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{attendee.eventTitle}</div>
                                                <div className="text-xs text-muted-foreground flex items-center">
                                                    <CalendarDays className="h-3 w-3 mr-1" />
                                                    {formatDate(attendee.eventStartTime, 'MMM d, h:mm a')}
                                                </div>
                                                {attendee.eventLocation && (
                                                    <div className="text-xs text-muted-foreground flex items-center">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        {attendee.eventLocation}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getTypeBadge(attendee.type)}
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {attendee.ticketType}
                                                {attendee.ticketPrice > 0 && (
                                                    <span> • {formatPrice(attendee.ticketPrice)}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(attendee.status)}
                                        </TableCell>
                                        <TableCell>
                                            {attendee.checkedInAt ? (
                                                <div className="flex items-center text-green-600">
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    <span className="text-xs">
                                                        {formatDate(attendee.checkedInAt, 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-muted-foreground">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    <span className="text-xs">Not checked in</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(attendee.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} attendees
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={!pagination.hasMore}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 