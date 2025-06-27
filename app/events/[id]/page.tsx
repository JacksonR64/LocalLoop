import React, { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { EventData } from '@/components/events';
import { notFound } from 'next/navigation'
import { EventDetailClient } from '@/components/events/EventDetailClient'

// Helper function to map numeric ID to UUID
function mapEventIdToUuid(numericId: string): string {
    const idMap: Record<string, string> = {
        '1': '550e8400-e29b-41d4-a716-446655440001',
        '2': '550e8400-e29b-41d4-a716-446655440002',
        '3': '550e8400-e29b-41d4-a716-446655440003',
        '4': '550e8400-e29b-41d4-a716-446655440004',
        '5': '550e8400-e29b-41d4-a716-446655440005',
        '6': '550e8400-e29b-41d4-a716-446655440006',
        '7': '550e8400-e29b-41d4-a716-446655440007',
        '8': '550e8400-e29b-41d4-a716-446655440008',
        '9': '00000000-0000-0000-0000-000000000009',
        '10': '550e8400-e29b-41d4-a716-446655440010',
        '11': '550e8400-e29b-41d4-a716-446655440011'
    };
    return idMap[numericId] || numericId;
}

// Server function to fetch event data from database
async function getEventData(eventId: string): Promise<EventData | null> {
    const supabase = await createServerSupabaseClient();

    // Try to determine if this is a UUID, numeric ID, or slug
    let queryValue = eventId;
    let queryField = 'id';

    // Check if it's a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(eventId)) {
        queryField = 'id';
        queryValue = eventId;
    }
    // Check if it's a numeric ID (convert to UUID)
    else if (/^\d+$/.test(eventId)) {
        queryField = 'id';
        queryValue = mapEventIdToUuid(eventId);
    }
    // Otherwise treat it as a slug
    else {
        queryField = 'slug';
        queryValue = eventId;
    }

    const { data: event, error } = await supabase
        .from('events')
        .select(`
      id,
      title,
      slug,
      description,
      short_description,
      start_time,
      end_time,
      location,
      category,
      is_paid,
      featured,
      capacity,
      image_url,
      organizer_id,
      users!events_organizer_id_fkey(display_name),
      rsvps(user_id),
      orders(
        id,
        status,
        total_amount,
        refund_amount,
        tickets(quantity)
      )
    `)
        .eq(queryField, queryValue)
        .eq('published', true)
        .single();

    if (error || !event) {
        console.error('Error fetching event:', error);
        return null;
    }

    // Transform data to match EventData interface
    interface UserData {
        display_name: string
    }

    // Calculate attendance based on event type
    const rsvpCount = event.rsvps?.length || 0;
    
    // Calculate ticket sales from completed orders (excluding refunded tickets)
    const ticketCount = event.orders
        ?.filter(order => 
            order.status === 'completed' && 
            (order.refund_amount === 0 || order.refund_amount < order.total_amount)
        )
        .reduce((total, order) => {
            const orderTickets = order.tickets?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0;
            return total + orderTickets;
        }, 0) || 0;

    // For paid events, use ticket count; for free events, use RSVP count
    const totalAttendance = event.is_paid ? ticketCount : rsvpCount;

    return {
        id: event.slug || eventId, // Use slug if available, otherwise the provided ID
        database_id: event.id, // Real database UUID for API calls
        title: event.title,
        description: event.description,
        short_description: event.short_description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        category: event.category,
        is_paid: event.is_paid,
        featured: event.featured,
        capacity: event.capacity,
        rsvp_count: totalAttendance,
        tickets_sold: ticketCount, // New field for ticket count
        image_url: event.image_url,
        organizer: {
            display_name: (Array.isArray(event.users)
                ? (event.users[0] as UserData)?.display_name
                : (event.users as UserData)?.display_name) || 'Unknown Organizer'
        }
    };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch event data from database
    const eventData = await getEventData(id);

    if (!eventData) {
        notFound();
    }

    return (
        <Suspense fallback={<div>Loading event...</div>}>
            <EventDetailClient event={eventData} />
        </Suspense>
    );
}

// Enable ISR with 15-minute revalidation
// Individual events change less frequently than the homepage,
// so we can use a longer revalidation interval for better performance
export const revalidate = 900; // 15 minutes 