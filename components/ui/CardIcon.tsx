import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the CardIcon component
 */
interface CardIconProps {
    /** The Lucide icon component to render */
    icon: LucideIcon;
    /** Additional CSS classes */
    className?: string;
    /** Icon size - defaults to 'md' */
    size?: 'sm' | 'md' | 'lg';
    /** ARIA label for accessibility */
    'aria-label'?: string;
}

/**
 * Size configurations for icons
 */
const ICON_SIZES = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
} as const;

/**
 * CardIcon component
 * 
 * A reusable icon component with consistent styling for card headers.
 * Provides size variants and accessibility support.
 * 
 * @example
 * ```tsx
 * <CardIcon icon={FileText} size="md" aria-label="About event" />
 * ```
 */
export const CardIcon = React.forwardRef<SVGSVGElement, CardIconProps>(
    ({ icon: Icon, className, size = 'md', 'aria-label': ariaLabel, ...props }, ref) => {
        return (
            <Icon
                ref={ref}
                className={cn(
                    ICON_SIZES[size],
                    'text-foreground flex-shrink-0',
                    className
                )}
                aria-label={ariaLabel}
                aria-hidden={!ariaLabel}
                {...props}
            />
        );
    }
);

CardIcon.displayName = 'CardIcon';