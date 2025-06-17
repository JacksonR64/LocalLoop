'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Grid, List, Clock, LayoutGrid } from 'lucide-react';
import {
    EventList,
    EventListWithHeader,
    GroupedEventList,
    type EventData,
    type EventListStyle,
    type EventListGrid
} from '@/components/events';

// Demo event data with comprehensive information
const demoEvents: EventData[] = [
    {
        id: '1',
        title: 'Community Garden Cleanup',
        description: 'Join us for a morning of community service cleaning up the local garden. We\'ll be removing weeds, planting new flowers, and maintaining the compost area.',
        short_description: 'Help clean up our community garden this Saturday morning.',
        start_time: '2024-01-20T10:00:00.000Z',
        end_time: '2024-01-20T14:00:00.000Z',
        location: 'Sunset Community Garden, 123 Garden Street',
        category: 'community',
        is_paid: false,
        featured: true,
        capacity: 25,
        rsvp_count: 12,
        image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
        image_alt_text: 'Community garden with volunteers working',
        organizer: {
            display_name: 'Garden Committee'
        }
    },
    {
        id: '2',
        title: 'Local Business Networking Mixer',
        description: 'Connect with other local business owners and entrepreneurs in our monthly networking event.',
        short_description: 'Network with local business owners over coffee and pastries.',
        start_time: '2024-01-22T18:00:00.000Z',
        end_time: '2024-01-22T20:00:00.000Z',
        location: 'Downtown Coffee Co., 456 Main Street',
        category: 'business',
        is_paid: true,
        featured: false,
        capacity: 15,
        rsvp_count: 8,
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        image_alt_text: 'Business professionals networking',
        organizer: {
            display_name: 'Chamber of Commerce'
        },
        ticket_types: [
            { price: 2500, name: 'Early Bird' }
        ]
    },
    {
        id: '3',
        title: 'Kids Art Workshop: Painting & Crafts',
        description: 'Creative art workshop designed specifically for children ages 6-12. Professional art instructors will guide kids through painting techniques.',
        short_description: 'Fun art workshop for kids with painting and crafts.',
        start_time: '2024-01-24T14:00:00.000Z',
        end_time: '2024-01-24T16:00:00.000Z',
        location: 'Community Center, Art Room B',
        category: 'arts',
        is_paid: true,
        featured: true,
        capacity: 20,
        rsvp_count: 18,
        image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
        image_alt_text: 'Children doing art and crafts',
        organizer: {
            display_name: 'Arts Alliance'
        },
        ticket_types: [
            { price: 1500, name: 'Child Ticket' }
        ]
    },
    {
        id: '4',
        title: 'Historical Walking Tour',
        description: 'Discover the rich history of our downtown area with this guided walking tour.',
        short_description: 'Guided tour of downtown historical sites.',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T11:00:00.000Z',
        location: 'City Hall Steps (Meeting Point)',
        category: 'education',
        is_paid: false,
        featured: false,
        capacity: 30,
        rsvp_count: 22,
        image_url: 'https://images.unsplash.com/photo-1464822759844-d150ad6d1b2f?w=400&h=300&fit=crop',
        image_alt_text: 'Historic downtown buildings',
        organizer: {
            display_name: 'Historical Society'
        }
    },
    {
        id: '5',
        title: 'Yoga in the Park',
        description: 'Join us for a peaceful morning yoga session in beautiful Riverside Park.',
        short_description: 'Morning yoga session in Riverside Park.',
        start_time: '2024-01-25T08:00:00.000Z',
        end_time: '2024-01-25T09:30:00.000Z',
        location: 'Riverside Park, East Pavilion',
        category: 'wellness',
        is_paid: true,
        featured: false,
        capacity: 40,
        rsvp_count: 35,
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        image_alt_text: 'People doing yoga in a park',
        organizer: {
            display_name: 'Wellness Collective'
        },
        ticket_types: [
            { price: 1200, name: 'Drop-in Class' }
        ]
    },
    {
        id: '6',
        title: 'Tech Meetup: AI & Machine Learning',
        description: 'Monthly tech meetup focusing on AI and machine learning trends, with guest speakers and networking.',
        short_description: 'Tech meetup on AI and machine learning with networking.',
        start_time: '2024-01-26T19:00:00.000Z',
        end_time: '2024-01-26T21:30:00.000Z',
        location: 'Innovation Hub, Conference Room A',
        category: 'technology',
        is_paid: false,
        featured: true,
        capacity: 50,
        rsvp_count: 42,
        image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
        image_alt_text: 'Tech meetup with laptops and presentations',
        organizer: {
            display_name: 'Tech Community'
        }
    }
];

export default function EventListDemoPage() {
    const [selectedStyle, setSelectedStyle] = useState<EventListStyle>('grid');
    const [selectedGrid, setSelectedGrid] = useState<EventListGrid>('auto');
    const [showImages, setShowImages] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    const handleEventClick = (eventId: string) => {
        console.log('Event clicked:', eventId);
    };

    // Group events by category for grouped demo
    const groupedEvents = demoEvents.reduce((acc, event) => {
        const category = event.category || 'General'
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(event);
        return acc;
    }, {} as Record<string, typeof demoEvents>);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-foreground">LocalLoop - Event Lists Demo</h1>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/demo" className="text-blue-600 hover:text-blue-800">← Card Demo</Link>
                            <Link href="/" className="text-blue-600 hover:text-blue-800">← Home</Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4">Event List Component Showcase</h2>
                    <p className="text-muted-foreground">
                        Demonstrating the different styles and configurations of the EventList component system.
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-card rounded-lg p-6 mb-8 shadow-sm border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">List Controls</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Style Selection */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">List Style</label>
                            <div className="space-y-2">
                                {(['grid', 'preview', 'full', 'compact', 'timeline'] as EventListStyle[]).map((style) => (
                                    <label key={style} className="flex items-center">
                                        <input
                                            type="radio"
                                            name="style"
                                            value={style}
                                            checked={selectedStyle === style}
                                            onChange={(e) => setSelectedStyle(e.target.value as EventListStyle)}
                                            className="mr-2"
                                        />
                                        <span className="capitalize">{style}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Grid Columns (only for grid style) */}
                        {selectedStyle === 'grid' && (
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Grid Columns</label>
                                <div className="space-y-2">
                                    {(['auto', '1', '2', '3', '4'] as EventListGrid[]).map((grid) => (
                                        <label key={grid} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="grid"
                                                value={grid}
                                                checked={selectedGrid === grid}
                                                onChange={(e) => setSelectedGrid(e.target.value as EventListGrid)}
                                                className="mr-2"
                                            />
                                            <span>{grid === 'auto' ? 'Auto (responsive)' : `${grid} column${grid !== '1' ? 's' : ''}`}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Options */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Options</label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={showImages}
                                        onChange={(e) => setShowImages(e.target.checked)}
                                        className="mr-2"
                                    />
                                    Show Images
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={showLoading}
                                        onChange={(e) => setShowLoading(e.target.checked)}
                                        className="mr-2"
                                    />
                                    Show Loading State
                                </label>
                            </div>
                        </div>

                        {/* Style Icons */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Style Preview</label>
                            <div className="flex gap-2">
                                {selectedStyle === 'grid' && <LayoutGrid className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                                {selectedStyle === 'preview' && <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                                {selectedStyle === 'full' && <Grid className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                                {selectedStyle === 'compact' && <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                                {selectedStyle === 'timeline' && <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Basic Event List */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Basic Event List</h3>
                    <p className="text-muted-foreground mb-6">Basic EventList component with current settings.</p>

                    <EventList
                        events={demoEvents}
                        style={selectedStyle}
                        gridColumns={selectedGrid}
                        showImages={showImages}
                        loading={showLoading}
                        loadingCount={6}
                        onEventClick={handleEventClick}
                    />
                </section>

                {/* Event List with Header */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Event List with Header</h3>
                    <p className="text-muted-foreground mb-6">EventListWithHeader component with title, subtitle, and action buttons.</p>

                    <EventListWithHeader
                        title="Upcoming Community Events"
                        subtitle="Discover amazing local events happening in your area"
                        showCount={true}
                        headerActions={
                            <div className="flex gap-2">
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                                    Create Event
                                </button>
                                <button className="border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm hover:bg-muted">
                                    Filter
                                </button>
                            </div>
                        }
                        events={demoEvents.slice(0, 4)}
                        style={selectedStyle}
                        gridColumns={selectedGrid}
                        showImages={showImages}
                        onEventClick={handleEventClick}
                    />
                </section>

                {/* Grouped Event List */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Grouped Event List</h3>
                    <p className="text-muted-foreground mb-6">GroupedEventList component organizing events by category.</p>

                    <GroupedEventList
                        groupedEvents={groupedEvents}
                        groupOrder={['community', 'business', 'arts', 'education', 'wellness', 'technology']}
                        showGroupHeaders={true}
                        style={selectedStyle}
                        gridColumns={selectedGrid}
                        showImages={showImages}
                        onEventClick={handleEventClick}
                    />
                </section>

                {/* Empty State Demo */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Empty State</h3>
                    <p className="text-muted-foreground mb-6">How the list appears when no events are available.</p>

                    <EventList
                        events={[]}
                        style={selectedStyle}
                        emptyStateMessage="No events match your current filters"
                        onEventClick={handleEventClick}
                    />
                </section>

                {/* Technical Information */}
                <section className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">Technical Implementation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-foreground mb-2">List Styles Available:</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li><code>grid</code> - Responsive card grid layout (default)</li>
                                <li><code>preview</code> - Horizontal compact cards</li>
                                <li><code>full</code> - Detailed view cards with actions</li>
                                <li><code>compact</code> - Minimal information layout</li>
                                <li><code>timeline</code> - Chronological timeline with connectors</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-foreground mb-2">Features:</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Multiple grid column options (1-4, auto)</li>
                                <li>Loading states with skeleton animations</li>
                                <li>Empty state handling with custom messages</li>
                                <li>Event grouping and headers</li>
                                <li>Click handlers and interaction states</li>
                                <li>Responsive design with proper spacing</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
} 