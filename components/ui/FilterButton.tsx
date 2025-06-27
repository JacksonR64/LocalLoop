'use client';

import React, { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterButtonProps {
    children: ReactNode;
    isOpen?: boolean;
    onClick?: () => void;
    hasActiveFilter?: boolean;
    placeholder?: string;
    className?: string;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: 'listbox' | 'menu' | 'dialog' | 'grid' | 'tree' | boolean;
    'aria-label'?: string;
    title?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const FilterButton = React.forwardRef<HTMLButtonElement, FilterButtonProps>(({
    children,
    isOpen = false,
    onClick,
    hasActiveFilter = false, // eslint-disable-line @typescript-eslint/no-unused-vars
    placeholder,
    className = '',
    onMouseEnter,
    onMouseLeave,
    ...ariaProps
}, ref) => {
    return (
        <button
            ref={ref}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`flex items-center justify-between w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-border rounded-md bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors ${className}`}
            {...ariaProps}
        >
            <div className="flex items-center gap-2 flex-1 text-left">
                {children || <span className="text-muted-foreground hover:text-foreground transition-colors">{placeholder}</span>}
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );
});

FilterButton.displayName = 'FilterButton';

interface FilterDropdownProps {
    children: ReactNode;
    isOpen: boolean;
    className?: string;
}

export function FilterDropdown({ children, isOpen, className = '' }: FilterDropdownProps) {
    if (!isOpen) return null;

    return (
        <div 
            className={`absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg transform transition-all duration-200 ease-out ${className}`}
            style={{
                animation: 'fadeInScale 200ms ease-out forwards'
            }}
        >
            {children}
        </div>
    );
}

interface FilterContainerProps {
    children: ReactNode;
    className?: string;
}

export const FilterContainer = React.forwardRef<HTMLDivElement, FilterContainerProps>(
    ({ children, className = '' }, ref) => {
        return (
            <div ref={ref} className={`relative ${className}`}>
                {children}
            </div>
        );
    }
);

FilterContainer.displayName = 'FilterContainer'; 