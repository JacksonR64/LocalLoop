'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { EventCard, type EventData } from '@/components/events';

// Demo event data with more comprehensive information
const demoEvents: EventData[] = [
    {
        id: '1',
        title: 'Community Garden Cleanup',
        description: 'Join us for a morning of community service cleaning up the local garden. We\'ll be removing weeds, planting new flowers, and maintaining the compost area. All tools and refreshments will be provided. This is a great opportunity to meet your neighbors and contribute to our local environment.',
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
        description: 'Connect with other local business owners and entrepreneurs in our monthly networking event. Features keynote speaker, structured networking sessions, and light refreshments. Perfect for growing your professional network and discovering collaboration opportunities.',
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
            { price: 2500, name: 'Early Bird' },
            { price: 3500, name: 'Regular' }
        ]
    },
    {
        id: '3',
        title: 'Kids Art Workshop: Painting & Crafts',
        description: 'Creative art workshop designed specifically for children ages 6-12. Professional art instructors will guide kids through painting techniques, craft projects, and creative expression. All materials included. Parents welcome to stay and watch.',
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
        description: 'Discover the rich history of our downtown area with this guided walking tour. Learn about historic buildings, local legends, and the people who shaped our community.',
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
    }
];

export default function DemoPage() {
    const handleEventClick = (eventId: string) => {
        console.log('Event clicked:', eventId);
    };

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
                            <h1 className="text-xl font-bold text-foreground">LocalLoop - Card Demo</h1>
                        </div>
                        <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4">Event Card Component Showcase</h2>
                    <p className="text-muted-foreground">
                        Demonstrating the different styles and variations of the EventCard component as implemented for Task 5.2.
                    </p>
                </div>

                {/* Default Style */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Default Style</h3>
                    <p className="text-muted-foreground mb-6">Standard card layout with different sizes for general use.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">Small (sm)</h4>
                            <EventCard
                                event={demoEvents[0]}
                                style="default"
                                size="sm"
                                onClick={() => handleEventClick(demoEvents[0].id)}
                            />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">Medium (md)</h4>
                            <EventCard
                                event={demoEvents[1]}
                                style="default"
                                size="md"
                                onClick={() => handleEventClick(demoEvents[1].id)}
                            />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">Large (lg) - Featured</h4>
                            <EventCard
                                event={demoEvents[2]}
                                style="default"
                                size="lg"
                                featured={true}
                                onClick={() => handleEventClick(demoEvents[2].id)}
                            />
                        </div>
                    </div>
                </section>

                {/* Preview List Style */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Preview List Style</h3>
                    <p className="text-muted-foreground mb-6">Compact horizontal layout for list views with essential information.</p>
                    <div className="space-y-4 max-w-4xl">
                        {demoEvents.slice(0, 3).map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                style="preview"
                                onClick={() => handleEventClick(event.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* Full List Style */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Full List Style</h3>
                    <p className="text-muted-foreground mb-6">Detailed view with comprehensive information and action buttons.</p>
                    <div className="space-y-8">
                        {demoEvents.slice(0, 2).map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                style="full"
                                onClick={() => handleEventClick(event.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* Compact Style */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Compact Style</h3>
                    <p className="text-muted-foreground mb-6">Minimal information for dense layouts and sidebars.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
                        {demoEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                style="compact"
                                onClick={() => handleEventClick(event.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* Timeline Style */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Timeline Style</h3>
                    <p className="text-muted-foreground mb-6">Vertical timeline layout with date circles for chronological displays.</p>
                    <div className="space-y-4 max-w-3xl">
                        {demoEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                style="timeline"
                                onClick={() => handleEventClick(event.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* Features Demonstration */}
                <section className="mb-16">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Special Features</h3>
                    <p className="text-muted-foreground mb-6">Demonstrating special features like image support, pricing, and status indicators.</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-lg font-medium text-foreground mb-4">With Images & Media</h4>
                            <EventCard
                                event={demoEvents[0]}
                                style="default"
                                size="lg"
                                showImage={true}
                                onClick={() => handleEventClick(demoEvents[0].id)}
                            />
                        </div>

                        <div>
                            <h4 className="text-lg font-medium text-foreground mb-4">Without Images</h4>
                            <EventCard
                                event={demoEvents[1]}
                                style="default"
                                size="lg"
                                showImage={false}
                                onClick={() => handleEventClick(demoEvents[1].id)}
                            />
                        </div>
                    </div>
                </section>

                {/* Technical Information */}
                <section className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">Technical Implementation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-foreground mb-2">Card Styles Available:</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li><code>default</code> - Standard card layout</li>
                                <li><code>preview</code> - Horizontal compact layout</li>
                                <li><code>full</code> - Detailed view with actions</li>
                                <li><code>compact</code> - Minimal information</li>
                                <li><code>timeline</code> - Timeline layout with date circles</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-foreground mb-2">Features:</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Multiple size variants (sm, md, lg)</li>
                                <li>Image support with fallback handling</li>
                                <li>Pricing display for paid events</li>
                                <li>Status indicators (past, featured, full)</li>
                                <li>Responsive design with hover effects</li>
                                <li>Accessibility support</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
} 