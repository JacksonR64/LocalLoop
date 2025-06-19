'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, MapPin, Users, Clock, Tag, ExternalLink, ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui';
import { formatDateTime, formatPrice, truncateText, getEventCardDescription } from '@/lib/utils';

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
            <div className={`bg-muted flex items-center justify-center ${className}`}>
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
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
    const isUpcoming = new Date(event.start_time) > new Date();
    const hasPrice = Boolean(event.is_paid && event.ticket_types && event.ticket_types.length > 0);
    const lowestPrice = hasPrice ? Math.min(...event.ticket_types!.map(t => t.price)) : 0;

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
        lowestPrice
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
function DefaultCard({ event, size, featured, showImage, className, onClick, spotsRemaining, isUpcoming, hasPrice, lowestPrice }: CardComponentProps) {
    return (
        <Card
            size={size}
            variant={featured ? 'elevated' : 'default'}
            className={`hover:shadow-lg transition-shadow cursor-pointer group ${className}`}
            onClick={onClick}
        >
            {showImage && event.image_url && (
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
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
                            <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                                Featured
                            </span>
                        </div>
                    )}
                </div>
            )}

            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle as={featured ? 'h2' : 'h3'} className={featured ? 'text-lg' : 'text-base'}>
                        {event.title}
                    </CardTitle>
                    <div className="flex gap-2">
                        {event.is_paid && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                                {hasPrice ? formatPrice(lowestPrice) : 'Paid'}
                            </span>
                        )}
                        {!isUpcoming && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                Past
                            </span>
                        )}
                    </div>
                </div>
                <CardDescription className="min-h-[3rem] line-clamp-2 text-sm leading-relaxed">
                    {getEventCardDescription(event.description, event.short_description)}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDateTime(event.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{event.location || 'Location TBD'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>
                            {event.rsvp_count} attending
                            {spotsRemaining && spotsRemaining > 0 && ` • ${spotsRemaining} spots left`}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="w-4 h-4 flex-shrink-0" />
                        <span className="capitalize">{event.category || 'General'}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    by {event.organizer.display_name}
                </span>
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm group-hover:underline flex items-center gap-1">
                    View Details
                    <ExternalLink className="w-3 h-3" />
                </button>
            </CardFooter>
        </Card>
    );
}

// Preview List Style - Compact horizontal layout for list views
function PreviewListCard({ event, className, onClick, isUpcoming, hasPrice, lowestPrice }: CardComponentProps) {
    return (
        <Card
            variant="outlined"
            className={`hover:shadow-md transition-shadow cursor-pointer group ${className}`}
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
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-base text-foreground truncate pr-2">
                            {event.title}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0">
                            {event.is_paid && (
                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                                    {hasPrice ? formatPrice(lowestPrice) : 'Paid'}
                                </span>
                            )}
                            {!isUpcoming && (
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                    Past
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                        {getEventCardDescription(event.description, event.short_description)}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.start_time).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {truncateText(event.location || 'Location TBD', 25)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.rsvp_count}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Full List Style - Detailed view with all information
function FullListCard({ event, className, onClick, spotsRemaining, isUpcoming, hasPrice, lowestPrice }: CardComponentProps) {
    return (
        <Card
            variant="default"
            size="lg"
            className={`hover:shadow-lg transition-shadow cursor-pointer group ${className}`}
            onClick={onClick}
        >
            {event.image_url && (
                <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
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

            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle as="h2" className="text-xl">
                        {event.title}
                    </CardTitle>
                    <div className="flex gap-2">
                        {event.is_paid && (
                            <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-medium">
                                {hasPrice ? formatPrice(lowestPrice) : 'Paid Event'}
                            </span>
                        )}
                        {!isUpcoming && (
                            <span className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full">
                                Past Event
                            </span>
                        )}
                    </div>
                </div>
                <CardDescription className="text-base line-clamp-2 min-h-[3rem] leading-relaxed">
                    {getEventCardDescription(event.description, event.short_description)}
                </CardDescription>
            </CardHeader>

            <CardContent>
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
                                <div className="font-medium">{event.location || 'Location TBD'}</div>
                                <div className="text-muted-foreground">View on map</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-foreground">
                            <Users className="w-5 h-5 flex-shrink-0 text-blue-600" />
                            <div>
                                <div className="font-medium">{event.rsvp_count} attending</div>
                                {spotsRemaining && spotsRemaining > 0 && (
                                    <div className="text-muted-foreground">{spotsRemaining} spots remaining</div>
                                )}
                                {event.capacity && spotsRemaining === 0 && (
                                    <div className="text-red-500">Event is full</div>
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
function CompactCard({ event, className, onClick, hasPrice, lowestPrice }: CardComponentProps) {
    return (
        <Card
            size="sm"
            variant="ghost"
            className={`hover:bg-muted transition-colors cursor-pointer group border-l-4 border-l-blue-600 ${className}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">
                        {event.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{new Date(event.start_time).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{truncateText(event.location || 'Location TBD', 20)}</span>
                        <span>•</span>
                        <span>{event.rsvp_count} attending</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                    {event.is_paid && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                            {hasPrice ? formatPrice(lowestPrice) : 'Paid'}
                        </span>
                    )}
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                </div>
            </div>
        </Card>
    );
}

// Timeline Card Style - Vertical timeline layout
function TimelineCard({ event, className, onClick, hasPrice, lowestPrice }: CardComponentProps) {
    const eventDate = new Date(event.start_time);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' });

    return (
        <Card
            variant="outlined"
            className={`hover:shadow-md transition-shadow cursor-pointer group ${className}`}
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
                        <h3 className="font-semibold text-base text-foreground group-hover:text-blue-600 transition-colors">
                            {event.title}
                        </h3>
                        {event.is_paid && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full ml-2">
                                {hasPrice ? formatPrice(lowestPrice) : 'Paid'}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                        {getEventCardDescription(event.description, event.short_description, 80)}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {truncateText(event.location || 'Location TBD', 25)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.rsvp_count}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Export all components
export { EventCard as default }; 