import { createServerSupabaseClient } from '@/lib/supabase-server'
import { HomePageClient } from '@/components/homepage/HomePageClient'

interface EventData {
  id: string
  title: string
  description?: string
  short_description?: string
  start_time: string
  end_time: string
  location?: string
  category?: string
  is_paid: boolean
  featured: boolean
  capacity?: number
  rsvp_count: number
  tickets_sold?: number
  image_url?: string
  organizer: {
    display_name: string
  }
}

// Server Component to fetch data from database
async function getEventsData(): Promise<EventData[]> {
  const supabase = await createServerSupabaseClient();

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
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
    .eq('published', true)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  // Transform data to match EventData interface
  return events?.map(event => {
    // Calculate attendance based on event type (same logic as event details page)
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
      id: event.id,
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
      tickets_sold: ticketCount,
      image_url: event.image_url,
      organizer: {
        display_name: (event.users as { display_name?: string })?.display_name || 'Unknown Organizer'
      }
    };
  }) || [];
}

// Main Page Component - Server Component that renders the full page
export default async function HomePage() {
  const events = await getEventsData();
  
  // Separate events by featured status
  const featuredEvents = events.filter(event => event.featured);
  
  // Pass all events to client - let client handle time-based filtering to avoid hydration mismatches
  return (
    <div className="min-h-screen bg-background">
      <HomePageClient
        featuredEvents={featuredEvents}
        allEvents={events}
      />
    </div>
  );
}

// Enable ISR with 5-minute revalidation
// This allows the homepage to be statically generated and cached,
// but revalidated every 5 minutes to ensure fresh event data
export const revalidate = 300; // 5 minutes
