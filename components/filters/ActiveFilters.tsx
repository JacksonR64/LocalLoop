'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ActiveFilter } from '@/lib/types/filters';

interface ActiveFiltersProps {
    activeFilters: ActiveFilter[];
    onClearAll?: () => void;
    className?: string;
}

export function ActiveFilters({ activeFilters, onClearAll, className = '' }: ActiveFiltersProps) {
    if (activeFilters.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                    Active filters ({activeFilters.length})
                </span>
                {onClearAll && activeFilters.length > 1 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-primary hover:text-primary/80 focus:outline-none focus:underline"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                    <FilterChip
                        key={`${filter.type}-${filter.value}-${index}`}
                        filter={filter}
                    />
                ))}
            </div>
        </div>
    );
}

interface FilterChipProps {
    filter: ActiveFilter;
}

function FilterChip({ filter }: FilterChipProps) {
    const getChipColor = (type: ActiveFilter['type']): string => {
        switch (type) {
            case 'category':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
            case 'dateRange':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
            case 'priceType':
                return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
            case 'searchQuery':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border ${getChipColor(filter.type)}`}
        >
            <span className="font-medium">{filter.label}</span>
            <button
                onClick={filter.removeFilter}
                className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 focus:outline-none focus:bg-black/10"
                aria-label={`Remove ${filter.label} filter`}
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
} 