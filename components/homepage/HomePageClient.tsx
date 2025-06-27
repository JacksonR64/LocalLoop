"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui';
import { EventCard, type EventData } from '@/components/events';
import { EventFilters } from '@/components/filters/EventFilters';
import { usePagination } from '@/lib/hooks/usePagination';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { Footer } from '@/components/ui/Footer';

interface HomePageClientProps {
  featuredEvents: EventData[];
  upcomingEvents: EventData[];
  pastEvents: EventData[];
}

export function HomePageClient({ featuredEvents, upcomingEvents, pastEvents }: HomePageClientProps) {
  const router = useRouter();
  const [filteredEvents, setFilteredEvents] = React.useState(upcomingEvents);
  const [showPastEvents, setShowPastEvents] = React.useState(false);

  // Memoize the filtered events setter to prevent infinite re-renders
  const handleFilteredEventsChange = React.useCallback((events: EventData[]) => {
    setFilteredEvents(events);
  }, []);

  // Sort past events by most recent first (reverse chronological order)
  const sortedPastEvents = React.useMemo(() => {
    return [...pastEvents].sort((a, b) => {
      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
    });
  }, [pastEvents]);

  // Pagination for upcoming events
  const {
    paginatedData: paginatedUpcomingEvents,
    loadMore,
    state: paginationState
  } = usePagination({
    data: filteredEvents,
    pageSize: 8
  });

  // Pagination for past events
  const {
    paginatedData: paginatedPastEvents,
    loadMore: loadMorePast,
    state: pastPaginationState
  } = usePagination({
    data: sortedPastEvents,
    pageSize: 8
  });

  // Infinite scroll setup for upcoming events
  const { loadingTriggerRef } = useInfiniteScroll({
    loadMore,
    hasMore: paginationState.hasMore,
    isLoading: paginationState.isLoading,
    threshold: 300
  });

  // Infinite scroll setup for past events
  const { loadingTriggerRef: pastLoadingTriggerRef } = useInfiniteScroll({
    loadMore: loadMorePast,
    hasMore: pastPaginationState.hasMore,
    isLoading: pastPaginationState.isLoading,
    threshold: 300
  });

  // Event click handler - navigate to event detail page
  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  // Category filter handler for hero pills
  const handleCategoryFilter = (category: string) => {
    // Filter upcoming events by category
    const categoryFiltered = upcomingEvents.filter(event =>
      event.category && event.category.toLowerCase() === category.toLowerCase()
    );
    handleFilteredEventsChange(categoryFiltered);

    // Scroll to upcoming events section
    const upcomingSection = document.getElementById('upcoming-events');
    if (upcomingSection) {
      upcomingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // View all events handler
  const handleViewAll = () => {
    handleFilteredEventsChange(upcomingEvents);
    const upcomingSection = document.getElementById('upcoming-events');
    if (upcomingSection) {
      upcomingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--primary)] to-purple-700 text-white py-20" data-test-id="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-test-id="hero-title">
            Discover Local Events
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto" data-test-id="hero-description">
            Connect with your community through amazing local events. From workshops to social gatherings, find your next adventure.
          </p>
          {/* EventFilters Integration */}
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8" data-test-id="event-filters-container">
            <EventFilters
              events={upcomingEvents}
              onFilteredEventsChange={handleFilteredEventsChange}
              showSearch={true}
              showActiveFilters={true}
              layout="horizontal"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-sm px-4" data-test-id="category-pills">
            <button
              onClick={() => handleCategoryFilter('workshop')}
              className="bg-white/30 hover:bg-white/40 text-white px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer font-medium"
              data-test-id="category-pill-workshop"
            >
              Workshop
            </button>
            <button
              onClick={() => handleCategoryFilter('community')}
              className="bg-white/30 hover:bg-white/40 text-white px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer font-medium"
              data-test-id="category-pill-community"
            >
              Community
            </button>
            <button
              onClick={() => handleCategoryFilter('arts')}
              className="bg-white/30 hover:bg-white/40 text-white px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer font-medium"
              data-test-id="category-pill-arts"
            >
              Arts
            </button>
            <button
              onClick={() => handleCategoryFilter('business')}
              className="bg-white/30 hover:bg-white/40 text-white px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer font-medium"
              data-test-id="category-pill-business"
            >
              Business
            </button>
            <button
              onClick={() => handleCategoryFilter('family')}
              className="bg-white/30 hover:bg-white/40 text-white px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer font-medium"
              data-test-id="category-pill-family"
            >
              Family
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" data-test-id="main-content">
        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="mb-12 sm:mb-16" data-test-id="featured-events-section">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6" data-test-id="featured-events-title">Featured Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-test-id="featured-events-grid">
              {featuredEvents.map((event) => (
                <div key={event.id} data-test-id={`featured-event-${event.id}`}>
                  <EventCard
                    event={event}
                    size="lg"
                    featured={true}
                    onClick={() => handleEventClick(event.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        <section id="upcoming-events" data-test-id="upcoming-events-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-test-id="upcoming-events-title">Upcoming Events</h2>
            <button
              onClick={handleViewAll}
              className="text-primary hover:text-primary/80 font-medium text-left sm:text-right"
              data-test-id="view-all-button"
            >
              View All →
            </button>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-muted-foreground px-4" data-test-id="no-events-message">
              <p className="mb-4 text-base sm:text-lg">No events match your search or filters.</p>
              <button
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors mb-4"
                onClick={handleViewAll}
                data-test-id="show-all-events-button"
              >
                Show All Events
              </button>
              <p className="text-sm">Try adjusting your search or filter criteria to find more events.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" data-test-id="upcoming-events-grid">
                {paginatedUpcomingEvents.map((event) => (
                  <div key={event.id} data-test-id={`upcoming-event-${event.id}`}>
                    <EventCard
                      event={event}
                      size="md"
                      featured={event.featured}
                      onClick={() => handleEventClick(event.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Infinite Scroll Loading Trigger */}
              <div ref={loadingTriggerRef} className="mt-6 sm:mt-8" data-test-id="loading-trigger">
                {paginationState.isLoading && (
                  <div data-test-id="loading-spinner">
                    <LoadingSpinner
                      size="md"
                      text="Loading more events..."
                      className="py-6 sm:py-8"
                    />
                  </div>
                )}
                {!paginationState.hasMore && paginatedUpcomingEvents.length > 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500" data-test-id="end-of-events-message">
                    <p>You&apos;ve reached the end of the events list.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <section className="mt-12 sm:mt-16" data-test-id="past-events-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-test-id="past-events-title">Past Events</h2>
              <button
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="text-muted-foreground hover:text-foreground font-medium text-left sm:text-right transition-colors"
                data-test-id="toggle-past-events-button"
              >
                {showPastEvents ? 'Hide Past Events' : 'Show Past Events'} {showPastEvents ? '↑' : '↓'}
              </button>
            </div>

            {showPastEvents && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" data-test-id="past-events-grid">
                  {paginatedPastEvents.map((event) => (
                    <div key={event.id} data-test-id={`past-event-${event.id}`}>
                      <EventCard
                        event={event}
                        size="md"
                        featured={event.featured}
                        onClick={() => handleEventClick(event.id)}
                      />
                    </div>
                  ))}
                </div>

                {/* Past Events Infinite Scroll Loading Trigger */}
                <div ref={pastLoadingTriggerRef} className="mt-6 sm:mt-8" data-test-id="past-events-loading-trigger">
                  {pastPaginationState.isLoading && (
                    <div data-test-id="past-events-loading-spinner">
                      <LoadingSpinner
                        size="md"
                        text="Loading more past events..."
                        className="py-6 sm:py-8"
                      />
                    </div>
                  )}
                  {!pastPaginationState.hasMore && paginatedPastEvents.length > 0 && (
                    <div className="text-center py-6 sm:py-8 text-gray-500" data-test-id="end-of-past-events-message">
                      <p>You&apos;ve reached the end of the past events list.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
} 