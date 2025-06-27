import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardHeader, CardTitle } from './Card';
import { CardIcon } from './CardIcon';

/**
 * Props for the IconCardHeader component
 */
interface IconCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The Lucide icon to display */
    icon: LucideIcon;
    /** The title text to display */
    title: string;
    /** Optional subtitle or description */
    subtitle?: string;
    /** Icon size - defaults to 'md' */
    iconSize?: 'sm' | 'md' | 'lg';
    /** Custom test ID for testing */
    testId?: string;
    /** Additional props for the CardHeader */
    headerProps?: React.ComponentProps<typeof CardHeader>;
    /** Additional props for the CardTitle */
    titleProps?: React.ComponentProps<typeof CardTitle>;
}

/**
 * IconCardHeader component
 * 
 * A reusable card header component that combines an icon with a title.
 * Provides consistent styling and accessibility features.
 * 
 * @example
 * ```tsx
 * <IconCardHeader 
 *   icon={FileText} 
 *   title="About This Event" 
 *   testId="about-event-header"
 * />
 * ```
 */
export const IconCardHeader = React.forwardRef<HTMLDivElement, IconCardHeaderProps>(
    ({ 
        icon, 
        title, 
        subtitle,
        iconSize = 'md',
        testId,
        className,
        headerProps,
        titleProps,
        ...props 
    }, ref) => {
        return (
            <CardHeader
                ref={ref}
                className={cn('pb-6', headerProps?.className, className)}
                {...headerProps}
                {...props}
            >
                <CardTitle 
                    className={cn(
                        'flex items-center gap-2',
                        titleProps?.className
                    )}
                    data-testid={testId}
                    {...titleProps}
                >
                    <CardIcon 
                        icon={icon} 
                        size={iconSize}
                        aria-label={`${title} section`}
                    />
                    <span className="truncate">{title}</span>
                </CardTitle>
                
                {subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {subtitle}
                    </p>
                )}
            </CardHeader>
        );
    }
);

IconCardHeader.displayName = 'IconCardHeader';