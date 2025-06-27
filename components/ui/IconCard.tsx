import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './Card';
import { IconCardHeader } from './IconCardHeader';
import { CardType, getCardConfig } from '@/lib/ui/card-types';

/**
 * Props for the IconCard component
 */
interface IconCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Predefined card type from the registry */
    cardType?: CardType;
    /** Custom icon (overrides cardType icon) */
    customIcon?: LucideIcon;
    /** Custom title (overrides cardType title) */
    customTitle?: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Children to render in the card content */
    children: React.ReactNode;
    /** Icon size - defaults to 'md' */
    iconSize?: 'sm' | 'md' | 'lg';
    /** Custom test ID (overrides cardType testId) */
    testId?: string;
    /** Additional props for the header */
    headerProps?: React.ComponentProps<typeof IconCardHeader>;
    /** Additional props for the content */
    contentProps?: Omit<React.ComponentProps<typeof CardContent>, 'children'>;
    /** Whether to include the header at all */
    includeHeader?: boolean;
}

/**
 * IconCard component
 * 
 * A complete card component with icon header and content area.
 * Can use predefined card types or custom configuration.
 * 
 * @example
 * ```tsx
 * // Using predefined card type
 * <IconCard cardType="about-event">
 *   <p>Event description content...</p>
 * </IconCard>
 * 
 * // Using custom configuration
 * <IconCard 
 *   customIcon={FileText} 
 *   customTitle="Custom Title"
 *   testId="custom-card"
 * >
 *   <p>Custom content...</p>
 * </IconCard>
 * ```
 */
export const IconCard = React.forwardRef<HTMLDivElement, IconCardProps>(
    ({ 
        cardType,
        customIcon,
        customTitle,
        subtitle,
        iconSize = 'md',
        testId,
        headerProps,
        contentProps,
        includeHeader = true,
        children,
        className,
        ...props 
    }, ref) => {
        // Get configuration from card type or use custom values
        const config = cardType ? getCardConfig(cardType) : null;
        
        const icon = customIcon || config?.icon;
        const title = customTitle || config?.title;
        const finalTestId = testId || config?.testId;
        
        // Validate that we have required props
        if (includeHeader && (!icon || !title)) {
            console.warn('IconCard: Missing required icon or title. Provide either cardType or both customIcon and customTitle.');
        }
        
        return (
            <Card
                ref={ref}
                className={cn('w-full', className)}
                data-testid={`${finalTestId}-card`}
                {...props}
            >
                {includeHeader && icon && title && (
                    <IconCardHeader
                        icon={icon}
                        title={title}
                        subtitle={subtitle}
                        iconSize={iconSize}
                        testId={finalTestId}
                        {...headerProps}
                    />
                )}
                
                <CardContent 
                    className={cn(
                        includeHeader ? 'pt-0' : undefined,
                        contentProps?.className
                    )}
                    {...(contentProps && { ...contentProps, className: undefined })}
                >
                    {children}
                </CardContent>
            </Card>
        );
    }
);

IconCard.displayName = 'IconCard';