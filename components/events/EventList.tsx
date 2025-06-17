'use client';

import React from 'react';
import { EventCard, type EventData } from './EventCard';
import { Card, CardContent } from '@/components/ui';

// Event List Display Styles
export type EventListStyle = 'grid' | 'preview' | 'full' | 'compact' | 'timeline';

// Grid layout options
export type EventListGrid = '1' | '2' | '3' | '4' | 'auto';

// Event list props
interface EventListProps {
    events: EventData[];
    style?: EventListStyle;
    gridColumns?: EventListGrid;
    showImages?: boolean;
    className?: string;
    onEventClick?: (eventId: string) => void;
    emptyStateMessage?: string;
    loading?: boolean;
    loadingCount?: number;
}

// Main EventList Component
export function EventList({
    events = [],
    style = 'grid',
    gridColumns = 'auto',
    showImages = true,
    className = '',
    onEventClick,
    emptyStateMessage = 'No events found',
    loading = false,
    loadingCount = 6
}: EventListProps) {
    // Loading state
    if (loading) {
        return (
            <LoadingState
                style={style}
                count={loadingCount}
                gridColumns={gridColumns}
                className={className}
            />
        );
    }

    // Empty state
    if (events.length === 0) {
        return (
            <EmptyState
                message={emptyStateMessage}
                className={className}
            />
        );
    }

    // Render list based on style
    switch (style) {
        case 'preview':
            return (
                <PreviewList
                    events={events}
                    showImages={showImages}
                    className={className}
                    onEventClick={onEventClick}
                />
            );
        case 'full':
            return (
                <FullList
                    events={events}
                    showImages={showImages}
                    className={className}
                    onEventClick={onEventClick}
                />
            );
        case 'compact':
            return (
                <CompactList
                    events={events}
                    className={className}
                    onEventClick={onEventClick}
                />
            );
        case 'timeline':
            return (
                <TimelineList
                    events={events}
                    className={className}
                    onEventClick={onEventClick}
                />
            );
        default: // grid
            return (
                <GridList
                    events={events}
                    gridColumns={gridColumns}
                    showImages={showImages}
                    className={className}
                    onEventClick={onEventClick}
                />
            );
    }
}

// Grid List - Default card grid layout
function GridList({ events, gridColumns, showImages, className, onEventClick }: {
    events: EventData[];
    gridColumns: EventListGrid;
    showImages: boolean;
    className: string;
    onEventClick?: (eventId: string) => void;
}) {
    const getGridClasses = () => {
        switch (gridColumns) {
            case '1': return 'grid-cols-1';
            case '2': return 'grid-cols-1 md:grid-cols-2';
            case '3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            case '4': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
            default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'; // auto
        }
    };

    return (
        <div className={`grid ${getGridClasses()} gap-6 ${className}`}>
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    style="default"
                    size="md"
                    featured={event.featured}
                    showImage={showImages}
                    onClick={() => onEventClick?.(event.id)}
                />
            ))}
        </div>
    );
}

// Preview List - Horizontal compact cards
function PreviewList({ events, showImages, className, onEventClick }: {
    events: EventData[];
    showImages: boolean;
    className: string;
    onEventClick?: (eventId: string) => void;
}) {
    return (
        <div className={`space-y-4 ${className}`}>
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    style="preview"
                    showImage={showImages}
                    onClick={() => onEventClick?.(event.id)}
                />
            ))}
        </div>
    );
}

// Full List - Detailed view cards
function FullList({ events, showImages, className, onEventClick }: {
    events: EventData[];
    showImages: boolean;
    className: string;
    onEventClick?: (eventId: string) => void;
}) {
    return (
        <div className={`space-y-8 ${className}`}>
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    style="full"
                    showImage={showImages}
                    onClick={() => onEventClick?.(event.id)}
                />
            ))}
        </div>
    );
}

// Compact List - Minimal information layout
function CompactList({ events, className, onEventClick }: {
    events: EventData[];
    className: string;
    onEventClick?: (eventId: string) => void;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    style="compact"
                    onClick={() => onEventClick?.(event.id)}
                />
            ))}
        </div>
    );
}

// Timeline List - Chronological timeline layout
function TimelineList({ events, className, onEventClick }: {
    events: EventData[];
    className: string;
    onEventClick?: (eventId: string) => void;
}) {
    // Sort events by date for proper timeline display
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    return (
        <div className={`space-y-4 ${className}`}>
            {sortedEvents.map((event, index) => (
                <div key={event.id} className="relative">
                    {/* Timeline connector line */}
                    {index < sortedEvents.length - 1 && (
                        <div className="absolute left-8 top-20 w-0.5 h-8 bg-border" />
                    )}

                    <EventCard
                        event={event}
                        style="timeline"
                        onClick={() => onEventClick?.(event.id)}
                    />
                </div>
            ))}
        </div>
    );
}

// Loading State Component
function LoadingState({ style, count, gridColumns, className }: {
    style: EventListStyle;
    count: number;
    gridColumns: EventListGrid;
    className: string;
}) {
    const skeletonItems = Array.from({ length: count }, (_, i) => i);

    if (style === 'grid') {
        const getGridClasses = () => {
            switch (gridColumns) {
                case '1': return 'grid-cols-1';
                case '2': return 'grid-cols-1 md:grid-cols-2';
                case '3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
                case '4': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
                default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
            }
        };

        return (
            <div className={`grid ${getGridClasses()} gap-6 ${className}`}>
                {skeletonItems.map((i) => (
                    <Card key={i} className="animate-pulse">
                        <div className="h-48 bg-muted rounded-t-lg" />
                        <CardContent className="p-4">
                            <div className="h-4 bg-muted rounded mb-2" />
                            <div className="h-3 bg-muted rounded mb-4 w-3/4" />
                            <div className="space-y-2">
                                <div className="h-3 bg-muted rounded w-full" />
                                <div className="h-3 bg-muted rounded w-2/3" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // For non-grid layouts, show vertical skeleton cards
    return (
        <div className={`space-y-4 ${className}`}>
            {skeletonItems.map((i) => (
                <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
                            <div className="flex-1">
                                <div className="h-4 bg-muted rounded mb-2" />
                                <div className="h-3 bg-muted rounded mb-2 w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Empty State Component
function EmptyState({ message, className }: {
    message: string;
    className: string;
}) {
    return (
        <Card className={`${className}`}>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <p className="text-muted-foreground text-lg mb-2">{message}</p>
                <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms</p>
            </CardContent>
        </Card>
    );
}

// Event List with Header Component
interface EventListWithHeaderProps extends EventListProps {
    title?: string;
    subtitle?: string;
    showCount?: boolean;
    headerActions?: React.ReactNode;
}

export function EventListWithHeader({
    title,
    subtitle,
    showCount = true,
    headerActions,
    events,
    ...listProps
}: EventListWithHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            {(title || subtitle || showCount || headerActions) && (
                <div className="flex items-center justify-between">
                    <div>
                        {title && (
                            <h2 className="text-2xl font-bold text-foreground">
                                {title}
                                {showCount && events.length > 0 && (
                                    <span className="ml-2 text-base font-normal text-muted-foreground">
                                        ({events.length} event{events.length !== 1 ? 's' : ''})
                                    </span>
                                )}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                    {headerActions && (
                        <div className="flex items-center gap-3">
                            {headerActions}
                        </div>
                    )}
                </div>
            )}

            {/* Event List */}
            <EventList events={events} {...listProps} />
        </div>
    );
}

// Grouped Event List Component (by date, category, etc.)
interface GroupedEventListProps extends Omit<EventListProps, 'events'> {
    groupedEvents: Record<string, EventData[]>;
    groupOrder?: string[];
    showGroupHeaders?: boolean;
}

export function GroupedEventList({
    groupedEvents,
    groupOrder,
    showGroupHeaders = true,
    ...listProps
}: GroupedEventListProps) {
    const groups = groupOrder || Object.keys(groupedEvents);

    return (
        <div className="space-y-8">
            {groups.map((groupKey) => {
                const groupEvents = groupedEvents[groupKey];
                if (!groupEvents || groupEvents.length === 0) return null;

                return (
                    <div key={groupKey} className="space-y-4">
                        {showGroupHeaders && (
                            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                                {groupKey} ({groupEvents.length})
                            </h3>
                        )}
                        <EventList events={groupEvents} {...listProps} />
                    </div>
                );
            })}
        </div>
    );
}

// Export all components
export { EventList as default }; 