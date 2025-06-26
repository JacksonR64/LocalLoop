'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/Card'
import {
    BarChart3,
    Calendar,
    Clock,
    DollarSign,
    Download,
    FileText,
    Filter,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Settings,
    TrendingUp,
    Users,
    AlertTriangle,
    Eye,
    Edit
} from 'lucide-react'
import AttendeeManagement from './AttendeeManagement'
import Analytics from './Analytics'

interface User {
    id: string
    email: string
    display_name?: string
    role: 'organizer' | 'admin'
}

interface StaffDashboardProps {
    user: User
}

interface EventStats {
    id: string
    title: string
    slug: string
    status: string
    start_time: string
    end_time: string
    published: boolean
    capacity?: number
    rsvp_count: number
    total_revenue: number
    ticket_sales: number
    pending_rsvps: number
}

interface DashboardMetrics {
    total_events: number
    active_events: number
    total_attendees: number
    total_revenue: number
    upcoming_events: number
    draft_events: number
}

export default function StaffDashboard({ user }: StaffDashboardProps) {
    const [events, setEvents] = useState<EventStats[]>([])
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        total_events: 0,
        active_events: 0,
        total_attendees: 0,
        total_revenue: 0,
        upcoming_events: 0,
        draft_events: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('overview')
    const [searchTerm, setSearchTerm] = useState('')
    const [showFilter, setShowFilter] = useState(false)
    const [filterStatus, setFilterStatus] = useState('all')

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (showFilter && !target.closest('.filter-dropdown')) {
                setShowFilter(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showFilter])

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true)

            // Fetch events and metrics
            const response = await fetch('/api/staff/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.id}`,
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data')
            }

            const data = await response.json()
            setEvents(data.events || [])
            setMetrics(prevMetrics => data.metrics || prevMetrics)
            setError(null)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [user.id])

    useEffect(() => {
        fetchDashboardData()
    }, [fetchDashboardData])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount / 100) // assuming amount is in cents
    }

    const formatDateTime = (dateString: string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(dateString))
    }

    const getEventStatusBadge = (event: EventStats) => {
        const now = new Date()
        const startDate = new Date(event.start_time)
        const endDate = new Date(event.end_time)

        if (!event.published) {
            return (
                <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">
                    Draft
                </Badge>
            )
        }

        if (endDate < now) {
            return (
                <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    Completed
                </Badge>
            )
        }

        if (startDate <= now && endDate >= now) {
            return (
                <Badge variant="default" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Live
                </Badge>
            )
        }

        return (
            <Badge variant="default" className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                <Calendar className="w-3 h-3 mr-1" />
                Upcoming
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Loading dashboard...</span>
                </div>
            </div>
        )
    }

    // Filter and search events
    const filteredEvents = events.filter(event => {
        const matchesSearch = searchTerm === '' || 
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
        
        const matchesFilter = filterStatus === 'all' || 
            (filterStatus === 'active' && !event.cancelled) ||
            (filterStatus === 'cancelled' && event.cancelled) ||
            (filterStatus === 'upcoming' && new Date(event.start_time) > new Date()) ||
            (filterStatus === 'past' && new Date(event.start_time) < new Date())
        
        return matchesSearch && matchesFilter
    }).sort((a, b) => {
        const now = new Date()
        const aDate = new Date(a.start_time)
        const bDate = new Date(b.start_time)
        
        const aIsUpcoming = aDate > now
        const bIsUpcoming = bDate > now
        
        // If both are upcoming, sort by date ascending (soonest first)
        if (aIsUpcoming && bIsUpcoming) {
            return aDate.getTime() - bDate.getTime()
        }
        
        // If both are past, sort by date descending (newest first)
        if (!aIsUpcoming && !bIsUpcoming) {
            return bDate.getTime() - aDate.getTime()
        }
        
        // Upcoming events always come before past events
        return aIsUpcoming ? -1 : 1
    })

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Staff Dashboard
                            <Badge
                                variant={user.role === 'admin' ? 'default' : 'secondary'}
                                className={`ml-3 text-xs ${user.role === 'admin'
                                    ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                    : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    }`}
                            >
                                {user.role === 'admin' ? 'Administrator' : 'Organizer'}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground">
                            Welcome back, {user.display_name || user.email}!
                            {user.role === 'admin'
                                ? ' You have full system access.'
                                : ' Manage your events and track performance.'
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={fetchDashboardData}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button asChild>
                            <Link href="/staff/events/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Event
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                            <p className="text-3xl font-bold text-foreground">{metrics.total_events}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600">{metrics.active_events} active</span>
                        <span className="text-muted-foreground ml-2">• {metrics.draft_events} drafts</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                            <p className="text-3xl font-bold text-foreground">{metrics.total_attendees}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-green-600">Across all events</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                            <p className="text-3xl font-bold text-foreground">{formatCurrency(metrics.total_revenue)}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-muted-foreground">From ticket sales</span>
                    </div>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="events" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Events
                        {events.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {events.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="attendees" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Attendees
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Events */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Recent Events</h3>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="?tab=events">View All</Link>
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {events.slice(0, 3).map((event) => (
                                    <div key={event.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-foreground">{event.title}</h4>
                                            <p className="text-sm text-muted-foreground">{formatDateTime(event.start_time)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getEventStatusBadge(event)}
                                        </div>
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <div className="text-center py-6">
                                        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground text-sm">No events yet</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/staff/events/create">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create New Event
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/staff?tab=attendees">
                                        <Users className="w-4 h-4 mr-2" />
                                        Manage Attendees
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/staff?tab=analytics">
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        View Analytics
                                    </Link>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => {
                                        // Simple CSV export of events data
                                        const csvData = events.map(event => ({
                                            title: event.title,
                                            date: event.start_time,
                                            location: event.location || 'TBD',
                                            attendees: event.rsvp_count,
                                            status: event.cancelled ? 'Cancelled' : 'Active'
                                        }));
                                        
                                        const csvContent = [
                                            ['Title', 'Date', 'Location', 'Attendees', 'Status'],
                                            ...csvData.map(row => [row.title, row.date, row.location, row.attendees.toString(), row.status])
                                        ].map(row => row.join(',')).join('\n');
                                        
                                        const blob = new Blob([csvContent], { type: 'text/csv' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                    }}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Data
                                </Button>

                                {/* Admin-only features */}
                                {user.role === 'admin' && (
                                    <>
                                        <div className="border-t pt-3 mt-3">
                                            <p className="text-xs text-muted-foreground mb-2 flex items-center">
                                                <Settings className="w-3 h-3 mr-1" />
                                                Administrator Tools
                                            </p>
                                        </div>
                                        <Button variant="outline" className="w-full justify-start" asChild>
                                            <Link href="/admin/settings">
                                                <Settings className="w-4 h-4 mr-2" />
                                                System Settings
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start" asChild>
                                            <Link href="/admin/users">
                                                <Users className="w-4 h-4 mr-2" />
                                                User Management
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events" className="mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {user.role === 'admin' ? 'All Events' : 'My Events'}
                            </h3>
                            {user.role === 'organizer' && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Showing events you&apos;ve created and manage
                                </p>
                            )}
                            {user.role === 'admin' && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    System-wide view of all events from all organizers
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative filter-dropdown">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowFilter(!showFilter)}
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filter
                                </Button>
                                {showFilter && (
                                    <div className="absolute top-full mt-2 right-0 bg-background border border-border rounded-lg shadow-lg p-3 z-10 min-w-48">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Filter by Status</p>
                                            <select 
                                                value={filterStatus} 
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="w-full p-2 text-sm border border-border rounded bg-background"
                                            >
                                                <option value="all">All Events</option>
                                                <option value="active">Active</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="upcoming">Upcoming</option>
                                                <option value="past">Past</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring w-64"
                                />
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    {filteredEvents.length === 0 ? (
                        <Card className="p-12">
                            <div className="text-center">
                                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    {events.length === 0 ? 'No events yet' : 'No events match your filters'}
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    {events.length === 0 
                                        ? 'Get started by creating your first event.'
                                        : 'Try adjusting your search terms or filters to find events.'
                                    }
                                </p>
                                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Link href="/staff/events/create">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Event
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredEvents.map((event) => (
                                <Card key={event.id} className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-lg font-semibold text-foreground">{event.title}</h4>
                                                {getEventStatusBadge(event)}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDateTime(event.start_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{event.rsvp_count} {event.is_paid === true ? 'attendees' : 'RSVPs'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    <span>{event.is_paid === true ? formatCurrency(event.total_revenue) : 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    <span>
                                                        {event.is_paid === true
                                                            ? `${event.ticket_sales || 0} tickets sold`
                                                            : 'Free RSVP'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/events/${event.slug}`}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/staff/events/${event.id}/edit`}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Attendees Tab */}
                <TabsContent value="attendees" className="mt-6">
                    <AttendeeManagement />
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="mt-6">
                    <Analytics />
                </TabsContent>
            </Tabs>
        </div>
    )
} 