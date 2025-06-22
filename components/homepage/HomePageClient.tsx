"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner, SectionToggle } from '@/components/ui';
import { EventCard, type EventData } from '@/components/events';
import { EventFilters } from '@/components/filters/EventFilters';
import { CompactSearchBar } from '@/components/search/CompactSearchBar';
import { usePagination } from '@/lib/hooks/usePagination';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { useSearch } from '@/lib/search-context';
import { Footer } from '@/components/ui/Footer';

interface HomePageClientProps {
  featuredEvents: EventData[];
  upcomingEvents: EventData[];
  pastEvents: EventData[];
}

export function HomePageClient({ featuredEvents, upcomingEvents, pastEvents }: HomePageClientProps) {
  const router = useRouter();
  const { isSearchOpen, isSearchAnimating } = useSearch();
  const [filteredEvents, setFilteredEvents] = React.useState(upcomingEvents);
  const [showPastEvents, setShowPastEvents] = React.useState(false);
  const [showFeaturedEvents, setShowFeaturedEvents] = React.useState(true);
  const [showUpcomingEvents, setShowUpcomingEvents] = React.useState(true);
  const [searchResults, setSearchResults] = React.useState<EventData[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = React.useState(false);
  
  // Separate state for CompactSearchBar
  const [compactSearchResults, setCompactSearchResults] = React.useState<EventData[]>([]);
  const [hasActiveCompactFilters, setHasActiveCompactFilters] = React.useState(false);


  // Memoize the filtered events setter to prevent infinite re-renders
  const handleFilteredEventsChange = React.useCallback((events: EventData[]) => {
    setFilteredEvents(events);
    
    // Check if filters are active by comparing filtered events with original upcoming events
    // Use Set-based comparison to check if the exact same events are present
    const filteredEventIds = new Set(events.map(e => e.id));
    const originalEventIds = new Set(upcomingEvents.map(e => e.id));
    
    const filtersActive = events.length !== upcomingEvents.length || 
                         !Array.from(filteredEventIds).every(id => originalEventIds.has(id)) ||
                         !Array.from(originalEventIds).every(id => filteredEventIds.has(id));
    
    setHasActiveFilters(filtersActive);
    
    // Set search results when filters are active
    if (filtersActive) {
      setSearchResults(events);
    } else {
      setSearchResults([]);
    }
  }, [upcomingEvents]);

  // Add a simpler handler that gets filter state directly from EventFilters
  const handleFiltersStateChange = React.useCallback((filtersActive: boolean, filteredEvents: EventData[]) => {
    setFilteredEvents(filteredEvents);
    setHasActiveFilters(filtersActive);
    
    if (filtersActive) {
      setSearchResults(filteredEvents);
    } else {
      setSearchResults([]);
    }
  }, []);

  // Clear all filters and reset to default state
  const handleClearFilters = React.useCallback(() => {
    setSearchResults([]);
    setHasActiveFilters(false);
    setFilteredEvents(upcomingEvents);
    // Scroll to top to show the original hero section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [upcomingEvents]);

  // Scroll to search results or upcoming events section when Enter is pressed in search
  const handleSearchEnter = React.useCallback(() => {
    const targetSection = hasActiveFilters ? 
      document.getElementById('search-results-section') || document.getElementById('no-search-results-section') :
      document.getElementById('upcoming-events');
    
    if (targetSection) {
      targetSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [hasActiveFilters]);

  // Separate handlers for CompactSearchBar
  const handleCompactFilteredEventsChange = React.useCallback((events: EventData[]) => {
    setCompactSearchResults(events);
  }, []);

  const handleCompactFiltersStateChange = React.useCallback((filtersActive: boolean, filteredEvents: EventData[]) => {
    setHasActiveCompactFilters(filtersActive);
    setCompactSearchResults(filteredEvents);
  }, []);

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
    data: pastEvents,
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
    setHasActiveFilters(true);
    setSearchResults(categoryFiltered);

    // Scroll to search results section when filters are active
    setTimeout(() => {
      const searchSection = document.getElementById('search-results-section') || 
                          document.getElementById('no-search-results-section');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };


  return (
    <>
      {/* Compact Search Bar - appears when search is toggled open */}
      {(isSearchOpen || isSearchAnimating) && (
        <CompactSearchBar
          events={upcomingEvents}
          onFilteredEventsChange={handleCompactFilteredEventsChange}
          onFiltersStateChange={handleCompactFiltersStateChange}
        />
      )}

      {/* Hero Section - always visible */}
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
                onFiltersStateChange={handleFiltersStateChange}
                showSearch={true}
                showActiveFilters={true}
                layout="horizontal"
                onSearchEnter={handleSearchEnter}
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
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 ${isSearchOpen ? 'pt-32' : 'pt-16'}`} data-test-id="main-content">
        {/* CompactSearchBar Search Results */}
        {isSearchOpen && hasActiveCompactFilters && compactSearchResults.length > 0 && (
          <section id="compact-search-results-section" className="mb-12 sm:mb-16" data-test-id="compact-search-results-section">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6" data-test-id="compact-search-results-title">
              Search Results ({compactSearchResults.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" data-test-id="compact-search-results-grid">
              {compactSearchResults.map((event) => (
                <div key={event.id} data-test-id={`compact-search-result-${event.id}`}>
                  <EventCard
                    event={event}
                    size="md"
                    featured={event.featured}
                    onClick={() => handleEventClick(event.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CompactSearchBar No Results */}
        {isSearchOpen && hasActiveCompactFilters && compactSearchResults.length === 0 && (
          <section id="compact-no-search-results-section" className="mb-12 sm:mb-16 text-center" data-test-id="compact-no-search-results-section">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">No Results Found</h2>
            <p className="text-muted-foreground mb-6">Try adjusting your search criteria or browse all events below.</p>
          </section>
        )}

        {/* Hero Search Results */}
        {!isSearchOpen && hasActiveFilters && searchResults.length > 0 && (
          <section id="search-results-section" className="mb-12 sm:mb-16" data-test-id="search-results-section">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6" data-test-id="search-results-title">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" data-test-id="search-results-grid">
              {searchResults.map((event) => (
                <div key={event.id} data-test-id={`search-result-${event.id}`}>
                  <EventCard
                    event={event}
                    size="md"
                    featured={event.featured}
                    onClick={() => handleEventClick(event.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hero No Search Results */}
        {!isSearchOpen && hasActiveFilters && searchResults.length === 0 && (
          <section id="no-search-results-section" className="mb-12 sm:mb-16 text-center" data-test-id="no-search-results-section">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">No Results Found</h2>
            <p className="text-muted-foreground mb-6">
              No events match your search or filter criteria. Try adjusting your search or clearing filters.
            </p>
          </section>
        )}

        {/* Featured Events - hidden when CompactSearchBar has active filters */}
        {featuredEvents.length > 0 && !(isSearchOpen && hasActiveCompactFilters) && (
          <section className="mb-12 sm:mb-16" data-test-id="featured-events-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-test-id="featured-events-title">Featured Events</h2>
              <SectionToggle
                isVisible={showFeaturedEvents}
                onToggle={() => setShowFeaturedEvents(!showFeaturedEvents)}
                showText="Show Featured Events"
                hideText="Hide Featured Events"
                data-testid="toggle-featured-events-button"
              />
            </div>

            {showFeaturedEvents && (
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
            )}
          </section>
        )}

        {/* Upcoming Events - hidden when CompactSearchBar has active filters */}
        {!(isSearchOpen && hasActiveCompactFilters) && (
        <section id="upcoming-events" data-test-id="upcoming-events-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-test-id="upcoming-events-title">Upcoming Events</h2>
            <SectionToggle
              isVisible={showUpcomingEvents}
              onToggle={() => setShowUpcomingEvents(!showUpcomingEvents)}
              showText="Show Upcoming Events"
              hideText="Hide Upcoming Events"
              data-testid="toggle-upcoming-events-button"
            />
          </div>

          {showUpcomingEvents && (
            <>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-muted-foreground px-4" data-test-id="no-events-message">
                  <p className="mb-4 text-base sm:text-lg">No events match your search or filters.</p>
                  <button
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors mb-4"
                    onClick={handleClearFilters}
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
            </>
          )}
        </section>
        )}

        {/* Past Events Section - hidden when CompactSearchBar has active filters */}
        {pastEvents.length > 0 && !(isSearchOpen && hasActiveCompactFilters) && (
          <section className="mt-12 sm:mt-16" data-test-id="past-events-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-test-id="past-events-title">Past Events</h2>
              <SectionToggle
                isVisible={showPastEvents}
                onToggle={() => setShowPastEvents(!showPastEvents)}
                showText="Show Past Events"
                hideText="Hide Past Events"
                data-testid="toggle-past-events-button"
              />
            </div>

            {showPastEvents && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" data-test-id="past-events-grid">
                  {paginatedPastEvents.map((event) => (
                    <div key={event.id} data-test-id={`past-event-${event.id}`}>
                      <EventCard
                        event={event}
                        size="md"
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