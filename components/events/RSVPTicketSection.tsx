'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconCard } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    CalendarDays,
    Clock,
    MapPin,
    Users,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Mail,
    User,
    Loader2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { cn } from '@/lib/utils';
import { useLoading } from '@/lib/loading-context';

// Types
interface RSVPTicketSectionProps {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    capacity?: number;
    currentRSVPs: number;
    isRegistrationOpen: boolean;
    isPaidEvent?: boolean;
    className?: string;
}

interface RSVPFormData {
    guestEmail?: string;
    guestName?: string;
    notes?: string;
}

interface User {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
        name?: string;
    };
}

interface RSVPData {
    id: string;
    event_id: string;
    created_at: string;
    status: string;
}

// Main component
const RSVPTicketSection: React.FC<RSVPTicketSectionProps> = ({
    eventId,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    capacity,
    currentRSVPs,
    isRegistrationOpen,
    isPaidEvent = false,
    className
}) => {
    // State management
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [existingRSVP, setExistingRSVP] = useState<RSVPData | null>(null);
    const [formData, setFormData] = useState<RSVPFormData>({
        guestEmail: '',
        guestName: '',
        notes: ''
    });

    // Global loading context
    const { withLoading } = useLoading();

    // Check existing RSVP for the user
    const checkExistingRSVP = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/rsvps?eventId=${eventId}&userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setExistingRSVP(data.rsvp || null);
            } else if (response.status === 401) {
                // Auth error - clear user state
                setUser(null);
                setExistingRSVP(null);
            } else {
                console.error('Failed to check existing RSVP:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error checking existing RSVP:', error);
            // Don't block the UI if RSVP check fails
            setExistingRSVP(null);
        }
    }, [eventId, user]);

    // Initialize Supabase client and check authentication
    useEffect(() => {
        const initializeAuth = async () => {
            const supabase = createClient();

            try {
                const { data: { user: currentUser }, error } = await supabase.auth.getUser();

                // Only log actual errors, not missing sessions
                if (error && error.message !== 'Auth session missing!') {
                    console.error('Auth error:', error);
                }

                setUser(currentUser);
            } catch (error) {
                // Only log unexpected errors, not auth session missing errors
                if (error instanceof Error && !error.message.includes('Auth session missing')) {
                    console.error('Error checking authentication:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            // Auth initialization timeout - gracefully handle slow auth
            setLoading(false);
        }, 5000); // 5 second timeout

        initializeAuth().finally(() => {
            clearTimeout(timeoutId);
        });

        return () => clearTimeout(timeoutId);
    }, [eventId]);

    // Separate effect to check RSVP when user changes
    useEffect(() => {
        if (user) {
            checkExistingRSVP();
        } else {
            setExistingRSVP(null);
        }
    }, [user, eventId, checkExistingRSVP]);

    // Handle RSVP submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (submitting) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData(e.currentTarget);
            const notes = formData.get('notes') as string;

            const rsvpData = user
                ? { event_id: eventId, notes }
                : {
                    event_id: eventId,
                    guest_email: formData.get('guest_email') as string,
                    guest_name: formData.get('guest_name') as string,
                    notes
                };

            // Use global loading indicator for the RSVP submission
            await withLoading((async () => {
                const response = await fetch('/api/rsvps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(rsvpData),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to create RSVP');
                }

                setSuccess('RSVP confirmed successfully!');
                setExistingRSVP(result.rsvp);

                // Reset form for guest users
                if (!user) {
                    (e.target as HTMLFormElement).reset();
                }
            })(), 'rsvp-submit');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle RSVP cancellation
    const handleCancel = async () => {
        if (!existingRSVP || submitting) return;

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch(`/api/rsvps/${existingRSVP.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                let errorMessage = result.error || 'Failed to cancel RSVP';
                
                // Provide user-friendly error messages
                if (response.status === 400 && errorMessage.includes('2 hours')) {
                    errorMessage = 'RSVPs can only be cancelled up to 2 hours before the event starts.';
                } else if (response.status === 401) {
                    errorMessage = 'You must be logged in to cancel your RSVP.';
                } else if (response.status === 404) {
                    errorMessage = 'RSVP not found or you do not have permission to cancel it.';
                }
                
                throw new Error(errorMessage);
            }

            setSuccess('RSVP cancelled successfully');
            setExistingRSVP(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (field: keyof RSVPFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Helper functions
    const isAtCapacity = capacity ? currentRSVPs >= capacity : false;
    const spotsLeft = capacity ? capacity - currentRSVPs : null;
    const getUserDisplayName = () => {
        if (!user) return '';
        return user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User';
    };

    // Loading state
    if (loading) {
        return (
            <IconCard 
                cardType="event-rsvp" 
                className={cn("w-full", className)}
                contentProps={{ className: "p-6" }}
            >
                <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading RSVP options...</span>
                </div>
            </IconCard>
        );
    }

    return (
        <IconCard 
            cardType="event-rsvp" 
            className={cn("w-full", className)} 
            data-test-id="rsvp-card"
            contentProps={{ className: "space-y-6" }}
        >
                {/* Event Summary */}
                <div className="bg-muted p-4 rounded-lg space-y-2" data-test-id="event-summary">
                    <h3 className="font-medium text-lg" data-test-id="event-title">{eventTitle}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2" data-test-id="event-date">
                            <CalendarDays className="h-4 w-4" />
                            <span>{eventDate}</span>
                        </div>
                        <div className="flex items-center gap-2" data-test-id="event-time">
                            <Clock className="h-4 w-4" />
                            <span>{eventTime}</span>
                        </div>
                        <div className="flex items-center gap-2" data-test-id="event-location">
                            <MapPin className="h-4 w-4" />
                            <span>{eventLocation}</span>
                        </div>
                    </div>
                </div>

                {/* Registration Status */}
                <div className="flex items-center justify-between" data-test-id="registration-status">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm" data-test-id="rsvp-count">
                            {isPaidEvent 
                                ? `${currentRSVPs} ticket${currentRSVPs !== 1 ? 's' : ''} sold`
                                : `${currentRSVPs} RSVP${currentRSVPs !== 1 ? 's' : ''}`
                            }
                            {capacity && ` / ${capacity} capacity`}
                        </span>
                    </div>

                    {spotsLeft !== null && (
                        <Badge variant={spotsLeft <= 5 ? "destructive" : "secondary"} data-test-id="spots-left-badge">
                            {spotsLeft === 0 
                                ? (isPaidEvent ? 'Sold Out' : 'Full')
                                : `${spotsLeft} ${isPaidEvent ? 'tickets' : 'spots'} left`
                            }
                        </Badge>
                    )}
                </div>

                {/* Status Messages */}
                {error && (
                    <Alert variant="destructive" data-test-id="error-message">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-200 bg-green-50" data-test-id="success-message">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Registration Closed */}
                {!isRegistrationOpen && (
                    <Alert variant="destructive" data-test-id="registration-closed-message">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Registration for this event is currently closed.
                        </AlertDescription>
                    </Alert>
                )}

                {/* At Capacity */}
                {isAtCapacity && isRegistrationOpen && (
                    <Alert variant="destructive" data-test-id="capacity-full-message">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            This event is at full capacity. Registration is currently unavailable.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Existing RSVP - Show cancellation option */}
                {existingRSVP && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg" data-test-id="existing-rsvp">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800" data-test-id="rsvp-confirmed-text">You&apos;re attending this event!</span>
                        </div>
                        <p className="text-sm text-green-700 mb-3" data-test-id="rsvp-confirmed-date">
                            RSVP confirmed on {new Date(existingRSVP.created_at).toLocaleDateString()}
                        </p>
                        <Button
                            variant="destructive-outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={submitting}
                            data-test-id="cancel-rsvp-button"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Cancel RSVP'
                            )}
                        </Button>
                    </div>
                )}

                {/* RSVP Form - Show if no existing RSVP and registration is open */}
                {!existingRSVP && isRegistrationOpen && !isAtCapacity && (
                    <form onSubmit={handleSubmit} className="space-y-4" data-test-id="rsvp-form">
                        {/* User Info Section */}
                        <div className="space-y-4">
                            {user ? (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg" data-test-id="authenticated-user-info">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-800" data-test-id="user-display-name">
                                            RSVPing as {getUserDisplayName()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-blue-700" data-test-id="user-email">{user.email}</p>
                                </div>
                            ) : (
                                <div className="space-y-3" data-test-id="guest-info-section">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Guest Information
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="guest-name-input" className="block text-sm font-medium mb-1">
                                                Full Name *
                                            </label>
                                            <Input
                                                id="guest-name-input"
                                                type="text"
                                                name="guest_name"
                                                placeholder="Enter your full name"
                                                value={formData.guestName || ''}
                                                onChange={(e) => handleInputChange('guestName', e.target.value)}
                                                autoComplete="name"
                                                required
                                                disabled={submitting}
                                                data-test-id="guest-name-input"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="guest-email-input" className="block text-sm font-medium mb-1">
                                                Email Address *
                                            </label>
                                            <Input
                                                id="guest-email-input"
                                                type="email"
                                                name="guest_email"
                                                placeholder="Enter your email"
                                                value={formData.guestEmail || ''}
                                                onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                                                autoComplete="email"
                                                required
                                                disabled={submitting}
                                                data-test-id="guest-email-input"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Optional Notes */}
                        <div>
                            <label htmlFor="rsvp-notes-textarea" className="block text-sm font-medium mb-1">
                                Additional Notes (Optional)
                            </label>
                            <Textarea
                                id="rsvp-notes-textarea"
                                name="notes"
                                placeholder="Any special requirements, dietary restrictions, or comments..."
                                value={formData.notes || ''}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                disabled={submitting}
                                rows={3}
                                data-test-id="rsvp-notes-textarea"
                                aria-label="Additional notes for your RSVP"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full"
                            size="lg"
                            data-test-id="rsvp-submit-button"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting RSVP...
                                </>
                            ) : (
                                'Confirm RSVP'
                            )}
                        </Button>
                    </form>
                )}

                {/* Login Prompt for Better Experience */}
                {!user && isRegistrationOpen && !existingRSVP && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg" data-test-id="login-prompt">
                        <p className="text-sm text-blue-700 mb-2">
                            <strong>Want to manage your RSVPs easily?</strong>
                        </p>
                        <p className="text-sm text-blue-600 mb-3">
                            Create an account to view all your event RSVPs, get personalized recommendations,
                            and never miss an update.
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild data-test-id="signup-button">
                                <a href="/auth/signup">Sign Up</a>
                            </Button>
                            <Button variant="ghost" size="sm" asChild data-test-id="login-button">
                                <a href="/auth/login">Log In</a>
                            </Button>
                        </div>
                    </div>
                )}

                {existingRSVP && (
                    <p className="text-sm text-gray-600 mb-4" data-test-id="rsvp-confirmed-description">
                        You&apos;re all set! We&apos;ve confirmed your RSVP for this event.
                    </p>
                )}
        </IconCard>
    );
};

export { RSVPTicketSection }; 