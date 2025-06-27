'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, MapPin, Users, Clock, Tag, ExternalLink, ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui';
import { formatDateTime, truncateText, getEventCardDescription, formatLocationForCard } from '@/lib/utils';
import { getEventTimingInfo } from '@/lib/utils/event-timing';
import { EventBadges } from '@/lib/utils/event-badges';

// Event interface (simplified from database types)
export interface EventData {
    id: string; // Display ID (slug or original ID)
    database_id?: string; // Real database UUID for API calls
    title: string;
    description?: string;
    short_description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    category?: string;
    is_paid: boolean;
    featured?: boolean;
    capacity?: number;
    rsvp_count: number;
    tickets_sold?: number; // New field for paid events
    is_open_for_registration?: boolean;
    image_url?: string | null;
    image_alt_text?: string;
    organizer: {
        id?: string;
        display_name: string;
    };
    ticket_types?: Array<{
        price: number;
        name: string;
    }>;
}

// Event Card Display Styles
export type EventCardStyle = 'default' | 'preview' | 'full' | 'compact' | 'timeline';

// Event Card Size Options
export type EventCardSize = 'sm' | 'md' | 'lg';

interface EventCardProps {
    event: EventData;
    style?: EventCardStyle;
    size?: EventCardSize;
    featured?: boolean;
    showImage?: boolean;
    className?: string;
    onClick?: () => void;
}

// Common card props interface
interface CardComponentProps {
    event: EventData;
    size?: EventCardSize;
    featured?: boolean;
    showImage?: boolean;
    className?: string;
    onClick?: () => void;
    spotsRemaining: number | null;
    isUpcoming: boolean;
    hasPrice: boolean;
    lowestPrice: number;
}

// Safe Image component with error handling
function SafeImage({
    src,
    alt,
    fill,
    className,
    sizes,
    placeholder,
    blurDataURL,
    ...props
}: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
    placeholder?: "blur" | "empty" | undefined;
    blurDataURL?: string;
} & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'fill' | 'className' | 'sizes' | 'placeholder' | 'blurDataURL'>) {
    const [hasError, setHasError] = React.useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
        setHasError(false);
    }, [src]);

    if (hasError || !src) {
        return (
            <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`} role="img" aria-label="Event image unavailable">
                <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-xs text-gray-500">Image unavailable</p>
                </div>
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill={fill}
            className={className}
            sizes={sizes}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            onError={() => setHasError(true)}
            priority={false}
            quality={75}
            {...props}
        />
    );
}

// Default Event Card Component
export function EventCard({
    event,
    style = 'default',
    size = 'md',
    featured = false,
    showImage = true,
    className = '',
    onClick
}: EventCardProps) {
    const spotsRemaining = event.capacity ? event.capacity - event.rsvp_count : null;
    const hasPrice = Boolean(event.is_paid && event.ticket_types && event.ticket_types.length > 0);
    const lowestPrice = hasPrice ? Math.min(...event.ticket_types!.map(t => t.price)) : 0;
    
    // Use shared timing logic
    const timingInfo = getEventTimingInfo(event.start_time);
    const { isUpcoming } = timingInfo;

    const commonProps: CardComponentProps = {
        event,
        size,
        featured: Boolean(featured),
        showImage: Boolean(showImage),
        className: className || '',
        onClick,
        spotsRemaining,
        isUpcoming,
        hasPrice,
        lowestPrice,
    };

    // Render based on style
    switch (style) {
        case 'preview':
            return <PreviewListCard {...commonProps} />;
        case 'full':
            return <FullListCard {...commonProps} />;
        case 'compact':
            return <CompactCard {...commonProps} />;
        case 'timeline':
            return <TimelineCard {...commonProps} />;
        default:
            return <DefaultCard {...commonProps} />;
    }
}

// Default Card Style (same as current homepage implementation)
function DefaultCard({ event, size, featured, showImage, className, onClick, spotsRemaining, isUpcoming, hasPrice, lowestPrice }: Readonly<CardComponentProps>) {
    const cardId = `event-card-${event.id}`
    const urgencyClass = ''
    
    

    return (
        <Card
            size={size}
            variant={featured ? 'elevated' : 'default'}
            className={`relative hover:shadow-lg transition-shadow cursor-pointer group ${urgencyClass} ${className}`}
            onClick={onClick}
            role="article"
            aria-labelledby={`${cardId}-title`}
            aria-describedby={`${cardId}-description ${cardId}-details`}
            data-test-id={`event-card-${event.id}`}
        >
            {showImage && event.image_url && (
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-gray-100">
                    <SafeImage
                        src={event.image_url}
                        alt={event.image_alt_text || event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                    {featured && (
                        <div className="absolute top-3 left-3">
                            <span 
                                className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium"
                                aria-label="Featured event"
                                data-test-id="featured-badge"
                            >
                                Featured
                            </span>
                        </div>
                    )}
                </div>
            )}


            {/* Badges positioned to overlap image and content */}
            <div className={`absolute ${size === 'lg' ? 'right-6' : 'right-4'} z-10`} style={{ top: size === 'lg' ? 'calc(12rem + 16px)' : 'calc(12rem + 8px)' }}>
                <EventBadges 
                    event={event}
                    isUpcoming={isUpcoming}
                    priceInfo={hasPrice ? { hasPrice, lowestPrice } : undefined}
                    className="flex gap-2"
                />
            </div>

            <CardHeader>
                <div className="flex items-start justify-between">
                    {/* 
                        Responsive card sizing:
                        - Mobile (< 640px): Dynamic height (h-auto) for natural content sizing
                        - Desktop (640px+): Fixed height for grid alignment
                        
                        Future admin configuration can be added here:
                        - Replace responsive classes with utility function
                        - Add configuration context/props for different sizing modes
                    */}
                    <div className="h-auto sm:h-16 flex items-center pr-2 pt-6 w-full">
                        <CardTitle 
                            as={featured ? 'h2' : 'h3'} 
                            className="text-base line-clamp-2 leading-6 w-full"
                            id={`${cardId}-title`}
                        >
                            {event.title}
                        </CardTitle>
                    </div>
                </div>
                {/* 
                    Responsive description sizing:
                    - Mobile: No minimum height (min-h-0) for compact display
                    - Desktop: Fixed minimum height for grid alignment
                */}
                <div className="min-h-0 sm:min-h-[3rem] flex items-center">
                    <CardDescription 
                        className="line-clamp-2 text-sm leading-relaxed w-full"
                        id={`${cardId}-description`}
                    >
                        {getEventCardDescription(event.description, event.short_description, 80)}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent>
                {/* Separator line */}
                <div className="border-t border-muted-foreground/20 my-3"></div>
                <div className="space-y-2 text-sm" id={`${cardId}-details`}>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{formatDateTime(event.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{formatLocationForCard(event.location)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span>
                            {event.is_paid 
                                ? `${event.tickets_sold || event.rsvp_count} tickets sold`
                                : `${event.rsvp_count} attending`
                            }
                            {spotsRemaining && spotsRemaining > 0 && ` • ${spotsRemaining} ${event.is_paid ? 'tickets' : 'spots'} left`}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span className="capitalize">{event.category || 'General'}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    by {event.organizer.display_name}
                </span>
                <button 
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm group-hover:underline flex items-center gap-1"
                    aria-label={`View details for ${event.title}`}
                    data-test-id="view-details-button"
                >
                    View Details
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </button>
            </CardFooter>
        </Card>
    );
}

// Preview List Style - Compact horizontal layout for list views
function PreviewListCard({ event, featured, className, onClick, isUpcoming, hasPrice, lowestPrice }: Readonly<CardComponentProps>) {
    const urgencyClass = ''
    
    return (
        <Card
            variant="outlined"
            className={`hover:shadow-md transition-shadow cursor-pointer group ${urgencyClass} ${className}`}
            onClick={onClick}
        >

            <div className="flex items-start gap-4 p-4">
                {event.image_url && (
                    <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <SafeImage
                            src={event.image_url}
                            alt={event.image_alt_text || event.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                        {featured && (
                            <div className="absolute top-1 left-1">
                                <span 
                                    className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-xs font-medium"
                                    aria-label="Featured event"
                                    data-test-id="featured-badge"
                                >
                                    Featured
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        {/* Responsive title sizing for preview cards */}
                        <div className="h-auto sm:h-16 flex items-center pr-2 pt-4 flex-1">
                            <h3 className="font-semibold text-base text-foreground line-clamp-2 leading-6 w-full">
                                {event.title}
                            </h3>
                        </div>
                        <EventBadges 
                            event={event}
                            isUpcoming={isUpcoming}
                            priceInfo={hasPrice ? { hasPrice, lowestPrice } : undefined}
                            className="flex gap-1 flex-shrink-0"
                        />
                    </div>

                    {/* Responsive description sizing for preview cards */}
                    <div className="min-h-0 sm:min-h-[2.5rem] flex items-center mb-3">
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed w-full">
                            {getEventCardDescription(event.description, event.short_description, 80)}
                        </p>
                    </div>

                    {/* Separator line */}
                    <div className="border-t border-muted-foreground/20 my-3"></div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{new Date(event.start_time).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{formatLocationForCard(event.location)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{event.rsvp_count}</span>
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Full List Style - Detailed view with all information
function FullListCard({ event, className, onClick, spotsRemaining, isUpcoming, hasPrice, lowestPrice }: Readonly<CardComponentProps>) {
    const urgencyClass = ''
    
    return (
        <Card
            variant="default"
            size="lg"
            className={`relative hover:shadow-lg transition-shadow cursor-pointer group ${urgencyClass} ${className}`}
            onClick={onClick}
        >
            {event.image_url && (
                <div className="relative w-full h-56 overflow-hidden rounded-t-lg bg-gray-100">
                    <SafeImage
                        src={event.image_url}
                        alt={event.image_alt_text || event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                        <span className="bg-black/50 px-2 py-1 rounded text-sm">
                            {event.category || 'General'}
                        </span>
                    </div>
                </div>
            )}

            {/* Badges positioned to overlap image and content */}
            <div className="absolute right-4 z-10" style={{ top: 'calc(14rem + 8px)' }}>
                <EventBadges 
                    event={event}
                    isUpcoming={isUpcoming}
                    priceInfo={hasPrice ? { hasPrice, lowestPrice } : undefined}
                    className="flex gap-2"
                />
            </div>

            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="h-20 flex items-center pt-4 w-full">
                        <CardTitle 
                            as="h2" 
                            className="text-xl line-clamp-2 leading-6 w-full"
                        >
                            {event.title}
                        </CardTitle>
                    </div>
                </div>
                <div className="min-h-[4.5rem] flex items-center">
                    <CardDescription className="text-base line-clamp-3 leading-relaxed w-full">
                        {event.short_description || event.description || ''}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent>
                {/* Separator line */}
                <div className="border-t border-muted-foreground/20 my-3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-foreground">
                            <Calendar className="w-5 h-5 flex-shrink-0 text-blue-600" />
                            <div>
                                <div className="font-medium">{formatDateTime(event.start_time)}</div>
                                <div className="text-muted-foreground">
                                    Duration: {Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60 * 60))} hours
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-foreground">
                            <MapPin className="w-5 h-5 flex-shrink-0 text-blue-600" />
                            <div>
                                <div className="font-medium">{formatLocationForCard(event.location)}</div>
                                <div className="text-muted-foreground">View on map</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-foreground">
                            <Users className="w-5 h-5 flex-shrink-0 text-blue-600" />
                            <div>
                                <div className="font-medium">
                                    {event.is_paid 
                                        ? `${event.rsvp_count} tickets sold`
                                        : `${event.rsvp_count} attending`
                                    }
                                </div>
                                {spotsRemaining && spotsRemaining > 0 && (
                                    <div className="text-muted-foreground">
                                        {spotsRemaining} {event.is_paid ? 'tickets' : 'spots'} remaining
                                    </div>
                                )}
                                {event.capacity && spotsRemaining === 0 && (
                                    <div className="text-red-500">
                                        {event.is_paid ? 'Sold out' : 'Event is full'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-foreground">
                            <Tag className="w-5 h-5 flex-shrink-0 text-blue-600" />
                            <div>
                                <div className="font-medium capitalize">{event.category || 'General'}</div>
                                <div className="text-muted-foreground">Category</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-6 border-t">
                <div>
                    <div className="font-medium text-foreground">Organized by</div>
                    <div className="text-muted-foreground">{event.organizer.display_name}</div>
                </div>
                <div className="flex gap-3">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        {event.is_paid ? 'Buy Tickets' : 'RSVP'}
                    </button>
                    <button className="border border-border text-foreground px-6 py-2 rounded-lg hover:bg-muted transition-colors">
                        Share
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
}

// Compact Card Style - Minimal information for dense layouts
function CompactCard({ event, className, onClick, hasPrice, lowestPrice, isUpcoming }: Readonly<CardComponentProps>) {
    const urgencyClass = 'border-l-blue-600'
    return (
        <Card
            size="sm"
            variant="ghost"
            className={`hover:bg-muted transition-colors cursor-pointer group border-l-4 ${urgencyClass} ${className}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate pt-4">
                        {event.title}
                    </h4>
                    {/* Separator line */}
                    <div className="border-t border-muted-foreground/20 my-2"></div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="truncate">{new Date(event.start_time).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="truncate">{formatLocationForCard(event.location)}</span>
                        <span>•</span>
                        <span className="truncate">{event.rsvp_count} attending</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                    <EventBadges 
                        event={event}
                        isUpcoming={isUpcoming}
                        priceInfo={hasPrice ? { hasPrice, lowestPrice } : undefined}
                        className="flex gap-2"
                    />
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                </div>
            </div>
        </Card>
    );
}

// Timeline Card Style - Vertical timeline layout
function TimelineCard({ event, featured, className, onClick, hasPrice, lowestPrice, isUpcoming }: Readonly<CardComponentProps>) {
    const eventDate = new Date(event.start_time);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
    const urgencyClass = ''
    

    return (
        <Card
            variant="outlined"
            className={`hover:shadow-md transition-shadow cursor-pointer group ${urgencyClass} ${className}`}
            onClick={onClick}
        >

            <div className="flex gap-4 p-4">
                {/* Date Circle */}
                <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex flex-col items-center justify-center">
                    <div className="text-lg font-bold leading-none">{day}</div>
                    <div className="text-xs uppercase leading-none">{month}</div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        {/* Responsive title sizing for timeline cards */}
                        <div className="h-auto sm:h-16 flex items-center pt-4 flex-1">
                            <h3 className="font-semibold text-base text-foreground group-hover:text-blue-600 transition-colors line-clamp-2 leading-6 w-full">
                                {event.title}
                            </h3>
                        </div>
                        <EventBadges 
                            event={event}
                            isUpcoming={isUpcoming}
                            priceInfo={hasPrice ? { hasPrice, lowestPrice } : undefined}
                            className="flex gap-1 ml-2"
                        />
                    </div>

                    {/* Responsive description sizing for timeline cards */}
                    <div className="min-h-0 sm:min-h-[2.5rem] flex items-center mb-2">
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed w-full">
                            {getEventCardDescription(event.description, event.short_description, 80)}
                        </p>
                    </div>

                    {/* Separator line */}
                    <div className="border-t border-muted-foreground/20 my-3"></div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                        </span>
                        <span className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{formatLocationForCard(event.location)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{event.rsvp_count}</span>
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Export all components
export { EventCard as default }; 