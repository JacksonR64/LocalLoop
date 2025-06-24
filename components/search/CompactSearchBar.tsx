'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { EventData } from '@/components/events';
import { EventFilters } from '@/components/filters/EventFilters';
import { useSearch } from '@/lib/search-context';
import { smoothScrollTo, calculateScrollTarget, animationPresets } from '@/lib/utils/smoothAnimations';

interface CompactSearchBarProps {
  events: EventData[];
  onFilteredEventsChange: (filteredEvents: EventData[]) => void;
  onFiltersStateChange?: (hasActiveFilters: boolean, filteredEvents: EventData[]) => void;
  onSearchClose?: (hasActiveFilters: boolean, filteredEvents: EventData[]) => void;
}

export function CompactSearchBar({
  events,
  onFilteredEventsChange,
  onFiltersStateChange,
  onSearchClose
}: CompactSearchBarProps) {
  const { closeSearch, searchAnimationType } = useSearch();
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandAnimating, setIsExpandAnimating] = useState(false);
  const [expandAnimationType, setExpandAnimationType] = useState<'enter' | 'exit'>('enter');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasTriggeredScroll, setHasTriggeredScroll] = useState(false);
  const [currentFilteredEvents, setCurrentFilteredEvents] = useState<EventData[]>([]);

  const scrollToSearchResults = useCallback(async () => {
    const compactSearchResultsSection = document.getElementById('compact-search-results-section') || 
                                       document.getElementById('compact-no-search-results-section');
    
    if (compactSearchResultsSection && searchBarRef.current) {
      // Get actual search bar height dynamically
      const searchBarHeight = searchBarRef.current.offsetHeight;
      const navHeight = 64; // Top navigation height
      const buffer = 10;
      
      const targetOffset = navHeight + searchBarHeight + buffer;
      const targetPosition = Math.max(0, compactSearchResultsSection.offsetTop - targetOffset);
      
      try {
        await smoothScrollTo(targetPosition, animationPresets.contentNavigation);
      } catch {
        // Fallback to native smooth scroll
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  // Synchronized scroll animation when search closes
  const animateSynchronizedScroll = useCallback(async () => {
    if (!searchBarRef.current) return;
    
    const searchBarHeight = searchBarRef.current.offsetHeight;
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate optimal scroll target using the new utility
    const targetScrollTop = calculateScrollTarget(searchBarHeight, currentScrollTop, {
      navHeight: 64,
      bufferZone: 10,
      minScroll: 0,
      maxReduction: 0.9 // Allow up to 90% reduction for smooth feel
    });
    
    // Only animate if there's a meaningful difference
    if (Math.abs(currentScrollTop - targetScrollTop) > 5) {
      try {
        await smoothScrollTo(targetScrollTop, animationPresets.searchClose);
      } catch {
        // Fallback to instant scroll if animation fails
        window.scrollTo(0, targetScrollTop);
      }
    }
  }, []);

  // Handle filters state change
  const handleFiltersStateChange = useCallback((hasFilters: boolean, filteredEvents: EventData[]) => {
    const hasSearchQuery = searchQuery.trim().length > 0;
    const totalFiltersActive = hasFilters || hasSearchQuery;
    
    setHasActiveFilters(totalFiltersActive);
    setCurrentFilteredEvents(filteredEvents);
    onFiltersStateChange?.(totalFiltersActive, filteredEvents);
    
    // Trigger scroll when user applies filters or search query changes
    if (totalFiltersActive && !hasTriggeredScroll) {
      setHasTriggeredScroll(true);
      setTimeout(() => {
        scrollToSearchResults();
      }, 100);
    }
  }, [searchQuery, onFiltersStateChange, hasTriggeredScroll, scrollToSearchResults]);

  // Update active filters when search query changes
  useEffect(() => {
    setHasActiveFilters(searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Auto-focus search input when component mounts (search opens)
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);


  // Handle ESC key to close search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Start synchronized scroll animation before closing
        animateSynchronizedScroll();
        closeSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeSearch, animateSynchronizedScroll]);

  // Handle click outside to close search on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth < 768 && searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        if (!target.closest('header') && !target.closest('[data-test-id*="dropdown"]')) {
          // Start synchronized scroll animation before closing
          animateSynchronizedScroll();
          closeSearch(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSearch, animateSynchronizedScroll]);

  const handleSearchEnter = () => {
    // Notify parent about search close with current filter state
    if (onSearchClose) {
      onSearchClose(hasActiveFilters, currentFilteredEvents);
    }
    
    // Start synchronized scroll animation immediately
    animateSynchronizedScroll();
    
    // Close search (animation will run in parallel)
    closeSearch(true); // Closed by Enter key
  };

  const handleToggleExpanded = () => {
    if (isExpanded) {
      // Start collapse animation
      setExpandAnimationType('exit');
      setIsExpandAnimating(true);
      setTimeout(() => {
        setIsExpanded(false);
        setTimeout(() => {
          setIsExpandAnimating(false);
        }, 500);
      }, 10);
    } else {
      // Start expand animation
      setExpandAnimationType('enter');
      setIsExpandAnimating(true);
      setIsExpanded(false);
      
      // Trigger active state in next frame for smooth transition
      requestAnimationFrame(() => {
        setIsExpanded(true);
      });
      
      setTimeout(() => {
        setIsExpandAnimating(false);
      }, 500);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Trigger scroll when user starts typing (first character)
    if (value.trim().length === 1 && !hasTriggeredScroll) {
      setHasTriggeredScroll(true);
      setTimeout(() => {
        scrollToSearchResults();
      }, 100);
    }
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setHasActiveFilters(false);
    setHasTriggeredScroll(false);
    // Reset filters through EventFilters component
    // This will be handled by the EventFilters component's internal state reset
  };

  const getFilterExpandClasses = () => {
    if (expandAnimationType === 'enter') {
      return isExpanded ? 'filter-expand-enter filter-expand-enter-active' : 'filter-expand-enter';
    }
    if (expandAnimationType === 'exit') {
      return isExpanded ? 'filter-expand-exit' : 'filter-expand-exit filter-expand-exit-active';
    }
    return '';
  };

  return (
    <>
      {/* Mobile Overlay Background - only show when expanded */}
      {isExpanded && (
        <div 
          className="md:hidden fixed inset-0 top-32 z-30 bg-black/10 transition-opacity duration-300 ease-out"
          onClick={() => closeSearch(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && closeSearch(false)}
          aria-label="Close search"
        />
      )}

      {/* Search Bar Container */}
      <div
        ref={searchBarRef}
        className={`fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-lg md:shadow-sm ${
          searchAnimationType === 'enter' 
            ? 'animate-smooth-slide-in' 
            : 'animate-smooth-slide-out'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8">
          {/* Mobile Compact Mode */}
          <div className="md:hidden">
            {/* Search Bar - Always visible */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchEnter()}
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              )}
              {!hasActiveFilters && (
                <button
                  onClick={handleToggleExpanded}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
                >
                  <span>Filters</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  )}
                </button>
              )}
            </div>
            
            {/* Expandable Filters Section */}
            {(isExpanded || isExpandAnimating) && (
              <div 
                className={getFilterExpandClasses()}
              >
                <div className="pb-3">
                  <EventFilters
                    events={events}
                    onFilteredEventsChange={onFilteredEventsChange}
                    onFiltersStateChange={handleFiltersStateChange}
                    showSearch={false}
                    showActiveFilters={false}
                    layout="horizontal"
                    className="search-horizontal"
                    onSearchEnter={handleSearchEnter}
                    externalSearchQuery={searchQuery}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Desktop - Always Expanded */}
          <div className="hidden md:block py-2 md:py-3">
            <EventFilters
              events={events}
              onFilteredEventsChange={onFilteredEventsChange}
              onFiltersStateChange={handleFiltersStateChange}
              showSearch={true}
              showActiveFilters={false}
              layout="horizontal"
              className="search-horizontal"
              onSearchEnter={handleSearchEnter}
              externalSearchQuery={searchQuery}
            />
          </div>
        </div>
      </div>
    </>
  );
}