'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { EventData } from '@/components/events';
import {
    EventFilters as EventFiltersType,
    DEFAULT_FILTERS
} from '@/lib/types/filters';
import {
    applyFilters,
    getEventCategories,
    getEventPriceCounts,
    hasActiveFilters,
    getFilterSummary
} from '@/lib/utils/eventFilters';
import { CategoryFilter } from './CategoryFilter';
import { DateFilter } from './DateFilter';
import { PriceFilter } from './PriceFilter';
import { SortControl } from './SortControl';
import { ActiveFilters } from './ActiveFilters';

interface EventFiltersProps {
    events: EventData[];
    onFilteredEventsChange: (filteredEvents: EventData[]) => void;
    onFiltersStateChange?: (hasActiveFilters: boolean, filteredEvents: EventData[]) => void;
    className?: string;
    showSearch?: boolean;
    showActiveFilters?: boolean;
    showFilters?: boolean;
    layout?: 'horizontal' | 'vertical';
    onSearchEnter?: () => void;
    externalSearchQuery?: string;
}

export function EventFilters({
    events,
    onFilteredEventsChange,
    onFiltersStateChange,
    className = '',
    showSearch = true,
    showActiveFilters = true,
    showFilters = true,
    layout = 'horizontal',
    onSearchEnter,
    externalSearchQuery
}: EventFiltersProps) {
    const [filters, setFilters] = useState<EventFiltersType>(DEFAULT_FILTERS);
    const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    // Update search query when external search query changes
    useEffect(() => {
        if (externalSearchQuery !== undefined) {
            setSearchQuery(externalSearchQuery);
        }
    }, [externalSearchQuery]);

    // Memoized calculations
    const categories = useMemo(() => getEventCategories(events), [events]);
    const priceCounts = useMemo(() => getEventPriceCounts(events), [events]);

    // Update filters helper
    const updateFilters = useCallback((newFilters: Partial<EventFiltersType>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Autocomplete suggestions
    const suggestions = useMemo(() => {
        if (searchQuery.trim().length < 2) return [];
        const query = searchQuery.toLowerCase();
        const titleMatches = events
            .map(e => e.title)
            .filter(title => title.toLowerCase().includes(query));
        const categoryMatches = categories
            .map(c => c.label)
            .filter(label => label.toLowerCase().includes(query));
        const locationMatches = events
            .map(e => e.location)
            .filter((loc): loc is string => loc != null && loc.toLowerCase().includes(query));
        // Remove duplicates and empty
        const all = Array.from(new Set([...titleMatches, ...categoryMatches, ...locationMatches]));
        return all.slice(0, 8);
    }, [searchQuery, events, categories]);

    // Apply filters and get filtered events
    const filteredEvents = useMemo(() => {
        const filtersWithSearch = { ...filters, searchQuery };
        return applyFilters(events, filtersWithSearch);
    }, [events, filters, searchQuery]);

    // Get active filters for display - temporarily disabled to fix infinite loop
    const activeFilters = useMemo(() => {
        return [];
    }, []);

    // Store callbacks in refs to avoid dependency issues
    const onFilteredEventsChangeRef = useRef(onFilteredEventsChange);
    const onFiltersStateChangeRef = useRef(onFiltersStateChange);

    // Update refs when callbacks change
    useEffect(() => {
        onFilteredEventsChangeRef.current = onFilteredEventsChange;
    }, [onFilteredEventsChange]);
    
    useEffect(() => {
        onFiltersStateChangeRef.current = onFiltersStateChange;
    }, [onFiltersStateChange]);

    // Update parent component when filtered events change
    useEffect(() => {
        onFilteredEventsChangeRef.current(filteredEvents);
        
        // Also notify about filter state if callback provided
        if (onFiltersStateChangeRef.current) {
            const filtersAreActive = hasActiveFilters({ ...filters, searchQuery });
            onFiltersStateChangeRef.current(filtersAreActive, filteredEvents);
        }
    }, [filteredEvents, filters, searchQuery]);

    // Handle search input
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setHighlightedIndex(-1);
    }, []);

    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion: string) => {
        setSearchQuery(suggestion);
        setIsSearchFocused(false);
        setHighlightedIndex(-1);
    };

    // Keyboard navigation for suggestions
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (suggestions.length > 0 && highlightedIndex >= 0) {
                // Select the highlighted suggestion
                handleSuggestionSelect(suggestions[highlightedIndex]);
                e.preventDefault();
            } else {
                // No suggestion highlighted or no suggestions - trigger scroll to events
                if (onSearchEnter) {
                    onSearchEnter();
                }
                e.preventDefault();
            }
            return;
        }
        
        if (!suggestions.length) return;
        
        if (e.key === 'ArrowDown') {
            setHighlightedIndex(i => (i + 1) % suggestions.length);
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            setHighlightedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
            e.preventDefault();
        }
    };

    // Clear all filters
    const handleClearAll = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        setSearchQuery('');
    }, []);

    // Get filter summary text
    const filterSummary = useMemo(() => {
        return getFilterSummary(events.length, filteredEvents.length, { ...filters, searchQuery });
    }, [events.length, filteredEvents.length, filters, searchQuery]);

    const isHorizontal = layout === 'horizontal';
    const isCompact = className?.includes('compact-mode');

    return (
        <div className={`${isCompact ? 'space-y-2' : 'space-y-4'} ${className}`}>
            {/* Search Bar with Autocomplete */}
            {showSearch && (
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 100)}
                        onKeyDown={handleSearchKeyDown}
                        className={`block w-full pl-10 pr-3 ${isCompact ? 'py-1.5' : 'py-2'} border border-border rounded-md leading-5 bg-background placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-sm`}
                        aria-autocomplete="list"
                        aria-controls={isSearchFocused && suggestions.length > 0 ? "search-suggestions" : undefined}
                        aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined}
                    />
                    {/* Autocomplete Suggestions Dropdown */}
                    {isSearchFocused && suggestions.length > 0 && (
                        <ul
                            id="search-suggestions"
                            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                            role="listbox"
                        >
                            {suggestions.map((suggestion, idx) => (
                                <li
                                    key={suggestion}
                                    id={`suggestion-${idx}`}
                                    role="option"
                                    aria-selected={highlightedIndex === idx}
                                    className={`px-3 py-2 cursor-pointer hover:bg-accent text-popover-foreground ${highlightedIndex === idx ? 'bg-accent' : ''}`}
                                    onMouseDown={() => handleSuggestionSelect(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Filter Controls */}
            {showFilters && (
                <div className={`${isCompact ? 'flex flex-wrap gap-1 sm:gap-2' : isHorizontal ? 'flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'}`}>
                    <CategoryFilter
                        selectedCategories={filters.categories}
                        onChange={(categories) => updateFilters({ categories })}
                        availableCategories={categories}
                        className={isHorizontal ? 'w-full sm:min-w-[200px] sm:flex-1' : ''}
                    />

                    <DateFilter
                        selectedRange={filters.dateRange}
                        onRangeChange={(dateRange) => updateFilters({ dateRange })}
                        className={isHorizontal ? 'w-full sm:min-w-[180px] sm:flex-1' : ''}
                    />

                    <PriceFilter
                        selectedPrice={filters.priceType}
                        onPriceChange={(priceType) => updateFilters({ priceType })}
                        eventCounts={priceCounts}
                        className={isHorizontal ? 'w-full sm:min-w-[140px] sm:flex-1' : ''}
                    />

                    <SortControl
                        sortBy={filters.sortBy}
                        onSortChange={(sortBy) => updateFilters({ sortBy })}
                        className={isHorizontal ? 'w-full sm:min-w-[180px] sm:flex-1' : ''}
                    />
                </div>
            )}

            {/* Active Filters */}
            {showActiveFilters && (
                <ActiveFilters
                    activeFilters={activeFilters}
                    onClearAll={hasActiveFilters({ ...filters, searchQuery }) ? handleClearAll : undefined}
                />
            )}

            {/* Filter Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>{filterSummary}</span>
                {hasActiveFilters({ ...filters, searchQuery }) && (
                    <button
                        onClick={handleClearAll}
                        className="text-primary hover:text-primary/80 focus:outline-none focus:underline text-left sm:text-right"
                    >
                        Clear all filters
                    </button>
                )}
            </div>
        </div>
    );
} 