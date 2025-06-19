'use client'

import { GoogleCalendarConnectWithStatus } from '@/components/GoogleCalendarConnect'

interface GoogleCalendarAddButtonProps {
    eventTitle: string
    eventTime: string
    eventLocation: string
    // paymentIntentId: string  // Currently unused but may be needed for future features
    // customerEmail: string    // Currently unused but may be needed for future features
    className?: string
}

export default function GoogleCalendarAddButton({
    eventTitle,
    eventTime,
    eventLocation,
    className = ''
}: GoogleCalendarAddButtonProps) {
    return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
            <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add to Calendar</h3>
                <p className="text-sm text-gray-600">
                    Add this event to your Google Calendar for easy access
                </p>
            </div>
            <GoogleCalendarConnectWithStatus
                action="create_event"
                returnUrl={`/events/${eventTitle}`}
                eventData={{
                    id: eventTitle,
                    title: eventTitle,
                    description: eventLocation,
                    start_time: eventTime,
                    end_time: eventTime,
                    location: eventLocation,
                    is_paid: true,
                    rsvp_count: 0,
                    organizer: { display_name: 'Event Organizer' }
                }}
                className="w-full"
            />
        </div>
    )
} 