'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Card size variants
export type CardSize = 'sm' | 'md' | 'lg';

// Card variant types for different use cases
export type CardVariant = 'default' | 'outlined' | 'elevated' | 'ghost';

// Card component props
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: CardSize;
    variant?: CardVariant;
    children: React.ReactNode;
}

// Individual card sub-components
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

// Size configurations
const sizeConfig = {
    sm: 'p-3 rounded-md',
    md: 'p-4 rounded-lg',
    lg: 'p-6 rounded-xl'
};

// Variant configurations
const variantConfig = {
    default: 'bg-background border border-border shadow-sm',
    outlined: 'bg-background border-2 border-border',
    elevated: 'bg-background border border-border shadow-lg',
    ghost: 'bg-transparent border-0'
};

// Main Card component
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, size = 'md', variant = 'default', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'transition-all duration-200',
                    sizeConfig[size],
                    variantConfig[variant],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Card Header component
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('flex flex-col space-y-1.5', className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

// Card Content component
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('flex flex-col space-y-2', className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardContent.displayName = 'CardContent';

// Card Footer component
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('flex items-center pt-2', className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardFooter.displayName = 'CardFooter';

// Card Title component
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, children, as: Component = 'h3', ...props }, ref) => {
        return (
            <Component
                ref={ref}
                className={cn('text-xl font-semibold leading-none tracking-tight', className)}
                {...props}
            >
                {children}
            </Component>
        );
    }
);

CardTitle.displayName = 'CardTitle';

// Card Description component
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <p
                ref={ref}
                className={cn('text-sm text-muted-foreground', className)}
                {...props}
            >
                {children}
            </p>
        );
    }
);

CardDescription.displayName = 'CardDescription'; 