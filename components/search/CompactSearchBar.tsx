'use client';

import React from 'react';
import { X, Search } from 'lucide-react';
import { EventData } from '@/components/events';
import { EventFilters } from '@/components/filters/EventFilters';

interface CompactSearchBarProps {
  events: EventData[];
  onFilteredEventsChange: (filteredEvents: EventData[]) => void;
  onFiltersStateChange?: (hasActiveFilters: boolean, filteredEvents: EventData[]) => void;
  onClearFilters: () => void;
}

export function CompactSearchBar({ 
  events, 
  onFilteredEventsChange,
  onFiltersStateChange,
  onClearFilters 
}: CompactSearchBarProps) {
  return (
    <div className="fixed top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          {/* Search Icon */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            
            {/* Compact Event Filters */}
            <div className="min-w-0 flex-1">
              <EventFilters
                events={events}
                onFilteredEventsChange={onFilteredEventsChange}
                onFiltersStateChange={onFiltersStateChange}
                showSearch={true}
                showActiveFilters={false}
                layout="horizontal"
                className="compact-mode"
                onSearchEnter={() => {
                  // Scroll to search results when Enter is pressed in compact mode
                  const searchResults = document.getElementById('search-results-section') || 
                                      document.getElementById('no-search-results-section');
                  if (searchResults) {
                    searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors flex-shrink-0"
            data-test-id="clear-filters-button"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}