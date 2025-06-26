import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Map event slugs to their corresponding UUIDs  
function getEventIdFromSlugOrId(eventIdOrSlug: string): string | null {
    const slugToUuidMap: { [key: string]: string } = {
        'local-business-networking': '00000000-0000-0000-0000-000000000002',
        'kids-art-workshop': '00000000-0000-0000-0000-000000000003', 
        'startup-pitch-night': '00000000-0000-0000-0000-000000000007',
        'food-truck-festival': '00000000-0000-0000-0000-000000000009',
        // Add more mappings as needed
    };

    // If it's already a UUID, return as is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdOrSlug)) {
        return eventIdOrSlug;
    }

    // If it's a numeric ID, convert to UUID format
    if (/^\d+$/.test(eventIdOrSlug)) {
        const num = parseInt(eventIdOrSlug);
        return `00000000-0000-0000-0000-${num.toString().padStart(12, '0')}`;
    }

    // If it's a known slug, map it to UUID
    // Otherwise, return the original slug to allow database lookup by slug
    return slugToUuidMap[eventIdOrSlug] || eventIdOrSlug;
}

// Custom datetime validation for datetime-local inputs
const dateTimeLocalSchema = z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
        if (!val || val === '') return null;
        // If it's already in ISO format, return as is
        if (val.includes('Z') || val.includes('+') || val.includes('-', 10)) {
            return val;
        }
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO
        // Assume local timezone for datetime-local inputs
        try {
            const date = new Date(val);
            return date.toISOString();
        } catch {
            throw new Error('Invalid date format');
        }
    })
    .refine((val) => {
        if (val === null) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, 'Invalid date');

// Ticket type creation schema
const ticketTypeSchema = z.object({
    event_id: z.string().uuid('Invalid event ID'),
    name: z.string().min(1, 'Ticket type name is required').max(100, 'Name must be 100 characters or less'),
    description: z.string().optional().nullable(),
    price: z.number().int().min(0, 'Price must be non-negative'), // in cents
    capacity: z.number().int().min(1, 'Capacity must be at least 1').nullable().optional(),
    sort_order: z.number().int().min(0).default(0),
    sale_start: dateTimeLocalSchema,
    sale_end: dateTimeLocalSchema,
}).refine(
    (data) => {
        if (data.sale_start && data.sale_end) {
            return new Date(data.sale_start) < new Date(data.sale_end);
        }
        return true;
    },
    {
        message: "Sale start time must be before sale end time",
        path: ["sale_start"],
    }
);

// Sample ticket types for development/demo events
function getSampleTicketTypes(eventId: string) {
    const sampleTickets: { [key: string]: Record<string, unknown>[] } = {
        '2': [ // Local Business Networking Mixer
            {
                id: '00000002-0001-0000-0000-000000000000',
                event_id: eventId,
                name: 'General Admission',
                description: 'Access to networking event and refreshments',
                price: 1500, // £15.00 in cents
                capacity: 40,
                sold_count: 12,
                sort_order: 0,
                sale_start: '2025-01-15T00:00:00.000Z',
                sale_end: '2026-05-12T16:00:00.000Z', // Extended to 2026
                created_at: '2025-01-10T00:00:00.000Z',
                updated_at: '2025-01-10T00:00:00.000Z'
            },
            {
                id: '00000002-0002-0000-0000-000000000000',
                event_id: eventId,
                name: 'Premium Pass',
                description: 'Includes private mixer with featured speakers',
                price: 3500, // £35.00 in cents
                capacity: 10,
                sold_count: 3,
                sort_order: 1,
                sale_start: '2025-01-15T00:00:00.000Z',
                sale_end: '2026-05-12T16:00:00.000Z', // Extended to 2026
                created_at: '2025-01-10T00:00:00.000Z',
                updated_at: '2025-01-10T00:00:00.000Z'
            }
        ],
        '3': [ // Kids Art Workshop
            {
                id: 'ticket-3-1',
                event_id: eventId,
                name: 'Child Ticket',
                description: 'Art supplies and snack included. Ages 6-12.',
                price: 1500, // £15.00 in cents
                capacity: 20,
                sold_count: 18,
                sort_order: 0,
                sale_start: '2025-01-20T00:00:00.000Z',
                sale_end: '2026-01-24T12:00:00.000Z', // Extended to 2026
                created_at: '2025-01-15T00:00:00.000Z',
                updated_at: '2025-01-15T00:00:00.000Z'
            }
        ],
        '7': [ // Startup Pitch Night
            {
                id: '00000007-0001-0000-0000-000000000000',
                event_id: eventId,
                name: 'General Admission',
                description: 'Includes networking and pitch viewing',
                price: 2000, // £20.00 in cents
                capacity: 100,
                sold_count: 32,
                sort_order: 0,
                sale_start: '2025-02-01T00:00:00.000Z',
                sale_end: '2026-03-15T18:00:00.000Z', // Extended to 2026
                created_at: '2025-01-25T00:00:00.000Z',
                updated_at: '2025-01-25T00:00:00.000Z'
            },
            {
                id: '00000007-0002-0000-0000-000000000000',
                event_id: eventId,
                name: 'Investor Access',
                description: 'Includes VIP networking with judges and investors',
                price: 7500, // £75.00 in cents
                capacity: 25,
                sold_count: 12,
                sort_order: 1,
                sale_start: '2025-02-01T00:00:00.000Z',
                sale_end: '2026-03-15T18:00:00.000Z', // Extended to 2026
                created_at: '2025-01-25T00:00:00.000Z',
                updated_at: '2025-01-25T00:00:00.000Z'
            }
        ],
        '9': [ // Food Truck Festival
            {
                id: 'ticket-9-1',
                event_id: eventId,
                name: 'Entry Pass',
                description: 'Festival entry and welcome drink',
                price: 1000, // £10.00 in cents
                capacity: 500,
                sold_count: 234,
                sort_order: 0,
                sale_start: '2025-03-01T00:00:00.000Z',
                sale_end: '2026-04-10T20:00:00.000Z', // Extended to 2026
                created_at: '2025-02-20T00:00:00.000Z',
                updated_at: '2025-02-20T00:00:00.000Z'
            },
            {
                id: 'ticket-9-2',
                event_id: eventId,
                name: 'Food Package',
                description: 'Entry plus $20 food voucher',
                price: 2500, // £25.00 in cents
                capacity: 200,
                sold_count: 89,
                sort_order: 1,
                sale_start: '2025-03-01T00:00:00.000Z',
                sale_end: '2026-04-10T20:00:00.000Z', // Extended to 2026
                created_at: '2025-02-20T00:00:00.000Z',
                updated_at: '2025-02-20T00:00:00.000Z'
            }
        ]
    };

    return sampleTickets[eventId] || null;
}

// GET /api/ticket-types - List ticket types for an event
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventIdOrSlug = searchParams.get('event_id');

        if (!eventIdOrSlug) {
            return NextResponse.json(
                { error: 'Event ID is required' },
                { status: 400 }
            );
        }

        // Map slug to ID if needed, or keep as is if already valid
        const eventId = getEventIdFromSlugOrId(eventIdOrSlug);

        // DISABLED: Sample tickets functionality - use database instead
        // For development/demo: Check for sample events first
        const ENABLE_SAMPLE_TICKETS = false; // Set to true only for testing
        if (ENABLE_SAMPLE_TICKETS && eventId) {
            const sampleTickets = getSampleTicketTypes(eventId);
            if (sampleTickets) {
                return NextResponse.json({ ticket_types: sampleTickets });
            }
        }

        // If not found in sample data, check the real database
        // This handles user-created events (UUIDs) and events not in sample data
        const supabase = await createServerSupabaseClient();

        if (!eventId) {
            return NextResponse.json(
                { error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        let actualEventId = eventId;

        // If it's not a UUID, try to find the event by slug in the database
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(eventId)) {
            // Query database to find event by slug
            const { data: event, error: eventError } = await supabase
                .from('events')
                .select('id')
                .eq('slug', eventId)
                .single();

            if (eventError || !event) {
                return NextResponse.json(
                    { error: 'Event not found. Please check the event ID or URL.' },
                    { status: 404 }
                );
            }

            actualEventId = event.id;
        }

        // Fetch ticket types and calculate sold counts from orders
        const { data: tickets, error } = await supabase
            .from('ticket_types')
            .select(`
                *,
                tickets!tickets_ticket_type_id_fkey(
                    quantity,
                    orders!tickets_order_id_fkey(
                        status,
                        refund_amount,
                        total_amount
                    )
                )
            `)
            .eq('event_id', actualEventId)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching ticket types:', error);
            return NextResponse.json(
                { error: 'Failed to fetch ticket types' },
                { status: 500 }
            );
        }

        // Calculate sold counts from completed, non-refunded orders
        const ticketsWithSoldCount = (tickets || []).map(ticket => {
            const soldCount = (ticket.tickets || []).reduce((total, ticketRecord) => {
                const order = ticketRecord.orders;
                // Only count tickets from completed orders that haven't been fully refunded
                if (order && 
                    order.status === 'completed' && 
                    (order.refund_amount === 0 || order.refund_amount < order.total_amount)) {
                    return total + (ticketRecord.quantity || 0);
                }
                return total;
            }, 0);

            return {
                ...ticket,
                sold_count: soldCount,
                // Remove the nested relationship data from response
                tickets: undefined
            };
        });

        return NextResponse.json({ ticket_types: ticketsWithSoldCount });

    } catch (error) {
        console.error('Unexpected error in GET /api/ticket-types:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/ticket-types - Create a new ticket type
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = ticketTypeSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const ticketTypeData = validationResult.data;
        const supabase = await createServerSupabaseClient();

        // Check if user is authenticated and is the event organizer
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify user is the event organizer
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('organizer_id, title')
            .eq('id', ticketTypeData.event_id)
            .single();

        if (eventError || !event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        if (event.organizer_id !== user.id) {
            return NextResponse.json(
                { error: 'Only event organizers can create ticket types' },
                { status: 403 }
            );
        }

        // Create the ticket type
        const { data: newTicketType, error: createError } = await supabase
            .from('ticket_types')
            .insert({
                event_id: ticketTypeData.event_id,
                name: ticketTypeData.name,
                description: ticketTypeData.description,
                price: ticketTypeData.price,
                capacity: ticketTypeData.capacity,
                sort_order: ticketTypeData.sort_order,
                sale_start: ticketTypeData.sale_start,
                sale_end: ticketTypeData.sale_end,
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating ticket type:', createError);
            return NextResponse.json(
                { error: 'Failed to create ticket type' },
                { status: 500 }
            );
        }

        // Update event to mark as paid if it wasn't already
        const { error: updateError } = await supabase
            .from('events')
            .update({ is_paid: true })
            .eq('id', ticketTypeData.event_id);

        if (updateError) {
            console.warn('Failed to update event paid status:', updateError);
            // Non-critical error, don't fail the request
        }

        return NextResponse.json(
            {
                message: 'Ticket type created successfully',
                ticket_type: newTicketType
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Unexpected error in POST /api/ticket-types:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 