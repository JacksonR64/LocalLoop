"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, User, DollarSign, Share2, Heart, ArrowLeft } from 'lucide-react';
import { Card, CardContent, IconCard } from '@/components/ui';
import { EventData } from '@/components/events';
import { EventMapWrapper as EventMap } from '@/components/events/EventMapWrapper';
import { RSVPTicketSection } from '@/components/events/RSVPTicketSection';
import TicketSelection from '@/components/events/TicketSelection';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { GoogleCalendarConnectWithStatus } from '@/components/GoogleCalendarConnect';
import { formatPrice } from '@/lib/utils/ticket-utils';
import type { TicketType } from '@/lib/types';
import { Footer } from '@/components/ui/Footer';

// Interface for selected tickets matching TicketSelection component
interface TicketSelectionItem {
    ticket_type_id: string;
    ticket_type: {
        id: string;
        name: string;
        price: number;
    };
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface EventDetailClientProps {
    event: EventData;
}

export function EventDetailClient({ event }: EventDetailClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [selectedTickets, setSelectedTickets] = useState<TicketSelectionItem[]>([]);
    const [checkoutStep, setCheckoutStep] = useState<'tickets' | 'checkout'>('tickets');
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

    // Fetch ticket types for paid events
    useEffect(() => {
        if (event.is_paid) {
            const fetchTicketTypes = async () => {
                try {
                    // Use database_id for API calls, fallback to id if not available
                    const eventId = event.database_id || event.id;
                    const response = await fetch(`/api/ticket-types?event_id=${eventId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setTicketTypes(data.ticket_types || []);
                    } else {
                        console.error('Failed to fetch ticket types');
                    }
                } catch (error) {
                    console.error('Error fetching ticket types:', error);
                }
            };
            fetchTicketTypes();
        }
    }, [event.id, event.database_id, event.is_paid]);

    // Check for payment success from redirect (e.g., PayPal) 
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const paymentIntentParam = searchParams.get('payment_intent');
        
        
        if (paymentStatus === 'success') {
            setShowPaymentSuccess(true);
            if (paymentIntentParam) {
                setPaymentIntentId(paymentIntentParam);
            }
            
            // Clean up URL parameters but preserve the anchor
            setTimeout(() => {
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('payment');
                    url.searchParams.delete('payment_intent');
                    url.searchParams.delete('payment_intent_client_secret');
                    
                    // Preserve the anchor when cleaning up
                    const cleanUrl = `${url.pathname}${url.search}#payment-success`;
                    router.replace(cleanUrl);
                } catch (error) {
                    console.warn('Failed to clean URL parameters:', error);
                }
            }, 2000); // Longer delay to ensure anchor navigation completes first
        }
    }, [searchParams, router]);

    // Separate effect for anchor navigation after success card is rendered
    useEffect(() => {
        if (showPaymentSuccess) {
            
            // Wait for DOM to be updated with the success card
            const attemptAnchorNavigation = () => {
                const paymentSuccessElement = document.getElementById('payment-success');
                if (paymentSuccessElement) {
                    router.replace('#payment-success');
                    return true;
                } else {
                    return false;
                }
            };

            // Try immediately
            if (!attemptAnchorNavigation()) {
                // If element not found, retry with increasing delays
                const retryAttempts = [100, 300, 500, 1000];
                retryAttempts.forEach((delay) => {
                    setTimeout(() => {
                        if (!document.getElementById('payment-success')) {
                            attemptAnchorNavigation();
                        }
                    }, delay);
                });
            }
        }
    }, [showPaymentSuccess, router]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleTicketsChange = (tickets: TicketSelectionItem[]) => {
        setSelectedTickets(tickets);
    };

    const getTotalPrice = () => {
        return selectedTickets.reduce((total, ticket) => total + ticket.total_price, 0);
    };

    const getTotalTickets = () => {
        return selectedTickets.reduce((total, ticket) => total + ticket.quantity, 0);
    };

    const handleProceedToCheckout = () => {
        setCheckoutStep('checkout');
    };

    const handleBackToTickets = () => {
        setCheckoutStep('tickets');
    };

    return (
        <div className="min-h-screen bg-background" data-test-id="event-detail-page">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-test-id="event-detail-main">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8" data-test-id="event-detail-content">
                        {/* Event Header */}
                        <div data-test-id="event-header">
                            {event.image_url && (
                                <div className="mb-6 relative w-full h-64" data-test-id="event-image">
                                    <Image
                                        src={event.image_url}
                                        alt={event.title}
                                        fill
                                        className="object-cover rounded-lg"
                                        priority
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-3xl font-bold text-foreground mb-2 break-words" data-test-id="event-title">{event.title}</h1>
                                    <p className="text-lg text-muted-foreground mb-4 break-words" data-test-id="event-short-description">{event.short_description}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0" data-test-id="event-actions">
                                    <button 
                                        className="p-2 rounded-lg border border-border hover:bg-accent transition-colors min-w-[40px] min-h-[40px]" 
                                        data-test-id="share-button"
                                        aria-label={`Share ${event.title} event`}
                                        title={`Share ${event.title}`}
                                    >
                                        <Share2 className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                                    </button>
                                    <button 
                                        className="p-2 rounded-lg border border-border hover:bg-accent transition-colors min-w-[40px] min-h-[40px]" 
                                        data-test-id="favorite-button"
                                        aria-label={`Add ${event.title} to favorites`}
                                        title={`Add to favorites`}
                                    >
                                        <Heart className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" data-test-id="event-details-grid">
                                <div className="flex items-center gap-3" data-test-id="event-date">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-foreground">{formatDate(event.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-3" data-test-id="event-time">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-foreground">
                                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3" data-test-id="event-location">
                                    <MapPin className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-foreground">{event.location || 'Location TBD'}</span>
                                </div>
                                <div className="flex items-center gap-3" data-test-id="event-organizer">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-foreground">{event.organizer.display_name}</span>
                                </div>
                            </div>

                            {event.is_paid && (
                                <div className="flex items-center gap-2 mb-6" data-test-id="paid-event-indicator">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <span className="text-green-600 font-medium">Paid Event</span>
                                </div>
                            )}
                        </div>

                        {/* Event Description */}
                        <IconCard 
                            cardType="about-event"
                            data-test-id="event-description-card"
                        >
                            <div className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-a:text-primary prose-a:hover:text-primary/80">
                                <p className="text-foreground leading-relaxed" data-test-id="event-description">{event.description}</p>
                            </div>
                        </IconCard>

                        {/* Map */}
                        {event.location && (
                            <IconCard 
                                cardType="location"
                                data-test-id="event-map-card"
                            >
                                <div data-test-id="event-map">
                                    <EventMap location={event.location || 'Location TBD'} eventTitle={event.title} />
                                </div>
                            </IconCard>
                        )}

                        {/* Google Calendar Integration */}
                        <IconCard 
                            cardType="add-calendar"
                            data-test-id="calendar-integration-card"
                        >
                            <div data-test-id="google-calendar-integration">
                                <GoogleCalendarConnectWithStatus
                                    action="create_event"
                                    returnUrl={`/events/${event.id}`}
                                    eventData={{
                                        id: event.id,
                                        title: event.title,
                                        description: event.description,
                                        start_time: event.start_time,
                                        end_time: event.end_time,
                                        location: event.location,
                                        is_paid: event.is_paid,
                                        rsvp_count: event.rsvp_count,
                                        organizer: event.organizer
                                    }}
                                />
                            </div>
                        </IconCard>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1" data-test-id="event-sidebar">
                        <div className="sticky top-0 space-y-6">
                            {/* Payment Success Message */}
                            {showPaymentSuccess ? (
                                <Card id="payment-success" data-test-id="payment-success-card">
                                    <CardContent className="text-center py-8">
                                        <div className="mb-4">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-green-700 mb-2">
                                            Payment Successful!
                                        </h2>
                                        <p className="text-muted-foreground mb-6">
                                            Your tickets have been purchased successfully.
                                        </p>
                                        
                                        <div className="bg-green-50 dark:bg-green-100 border border-green-200 dark:border-green-300 rounded-lg p-4 mb-6 text-left">
                                            <h3 className="font-semibold text-green-800 dark:text-green-800 mb-2">Order Details</h3>
                                            <div className="space-y-1 text-sm text-green-700 dark:text-green-700">
                                                {paymentIntentId && <div>Payment ID: {paymentIntentId}</div>}
                                                <div>Event: {event.title}</div>
                                                <div>Date: {formatDate(event.start_time)}</div>
                                                <div>Time: {formatTime(event.start_time)}</div>
                                            </div>
                                        </div>

                                        <div className="text-sm text-muted-foreground mb-6">
                                            A confirmation email with your tickets has been sent to your email address.
                                            Please save this email as it contains important information for event entry.
                                        </div>

                                        <div className="space-y-4">
                                            <GoogleCalendarConnectWithStatus
                                                action="create_event"
                                                returnUrl={`/events/${event.id}`}
                                                eventData={{
                                                    id: event.id,
                                                    title: event.title,
                                                    description: event.description,
                                                    start_time: event.start_time,
                                                    end_time: event.end_time,
                                                    location: event.location,
                                                    is_paid: event.is_paid,
                                                    rsvp_count: event.rsvp_count,
                                                    organizer: event.organizer
                                                }}
                                            />
                                            
                                            <button
                                                onClick={() => setShowPaymentSuccess(false)}
                                                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                                data-test-id="continue-to-event-button"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Continue to Event
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    {/* Registration/Ticket Section */}
                                    {event.is_paid && ticketTypes.length > 0 ? (
                                        checkoutStep === 'tickets' ? (
                                    <div className="space-y-4" data-test-id="ticket-section">
                                        <div data-test-id="ticket-selection-component">
                                            <TicketSelection
                                                eventId={event.id}
                                                selectedTickets={selectedTickets}
                                                onTicketsChange={handleTicketsChange}
                                                eventCapacity={event.capacity}
                                            />
                                        </div>

                                        {getTotalTickets() > 0 && (
                                            <Card data-test-id="ticket-summary">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="font-medium text-foreground">Total:</span>
                                                        <span className="text-xl font-bold text-foreground" data-test-id="total-price">{formatPrice(getTotalPrice())}</span>
                                                    </div>
                                                    <button
                                                        onClick={handleProceedToCheckout}
                                                        className="w-full min-w-0 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors overflow-hidden"
                                                        data-test-id="proceed-to-checkout-button"
                                                    >
                                                        <span className="truncate block">Proceed to Checkout</span>
                                                    </button>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4" data-test-id="checkout-section">
                                        <button
                                            onClick={handleBackToTickets}
                                            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                                            data-test-id="back-to-tickets-button"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back to Tickets
                                        </button>

                                        <div data-test-id="checkout-form">
                                            <CheckoutForm
                                                eventId={event.id}
                                                selectedTickets={selectedTickets}
                                                onSuccess={(paymentIntentId) => {
                                                    setShowPaymentSuccess(true);
                                                    setPaymentIntentId(paymentIntentId);
                                                    setCheckoutStep('tickets');
                                                }}
                                                onCancel={() => {
                                                    setCheckoutStep('tickets')
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            ) : event.is_paid ? (
                                // Show loading state for paid events while fetching ticket types
                                <Card data-test-id="ticket-loading">
                                    <CardContent className="p-6 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                            <span className="text-muted-foreground">Loading ticket options...</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div data-test-id="rsvp-section">
                                    <RSVPTicketSection
                                        eventId={event.database_id || event.id}
                                        eventTitle={event.title}
                                        eventDate={formatDate(event.start_time)}
                                        eventTime={formatTime(event.start_time)}
                                        eventLocation={event.location || 'Location TBD'}
                                        capacity={event.capacity}
                                        currentRSVPs={event.rsvp_count}
                                        isRegistrationOpen={true}
                                        isPaidEvent={event.is_paid}
                                    />
                                </div>
                            )}

                                    {/* Event Stats */}
                                    <IconCard 
                                        cardType="event-details"
                                        data-test-id="event-stats-card"
                                    >
                                        <div className="bg-muted p-4 rounded-lg space-y-3" data-test-id="event-stats-list">
                                                <div className="flex justify-between" data-test-id="event-category">
                                                    <span className="text-muted-foreground">Category:</span>
                                                    <span className="text-foreground capitalize">{event.category}</span>
                                                </div>
                                                {event.capacity && (
                                                    <div className="flex justify-between" data-test-id="event-capacity">
                                                        <span className="text-muted-foreground">Capacity:</span>
                                                        <span className="text-foreground">{event.capacity}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between" data-test-id="event-rsvp-count">
                                                    <span className="text-muted-foreground">
                                                        {event.is_paid ? 'Tickets Sold:' : 'RSVPs:'}
                                                    </span>
                                                    <span className="text-foreground">
                                                        {event.is_paid ? (event.tickets_sold || event.rsvp_count) : event.rsvp_count}
                                                    </span>
                                                </div>
                                        {event.capacity && (
                                            <div className="flex justify-between" data-test-id="event-available-spots">
                                                <span className="text-muted-foreground">
                                                    {event.is_paid ? 'Tickets Left:' : 'Available:'}
                                                </span>
                                                <span className="text-foreground">
                                                    {event.capacity - (event.is_paid ? (event.tickets_sold || event.rsvp_count) : event.rsvp_count)}
                                                </span>
                                            </div>
                                        )}
                                        </div>
                                    </IconCard>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
} 