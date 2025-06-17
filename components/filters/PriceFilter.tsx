'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { PriceFilterType, PRICE_FILTER_OPTIONS } from '@/lib/types/filters';
import { FilterButton, FilterDropdown, FilterContainer } from '@/components/ui/FilterButton';

interface PriceFilterProps {
    selectedPrice: PriceFilterType;
    onPriceChange: (priceType: PriceFilterType) => void;
    eventCounts?: { free: number; paid: number; total: number };
    className?: string;
}

export function PriceFilter({
    selectedPrice,
    onPriceChange,
    eventCounts,
    className = ''
}: PriceFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get display text for current selection
    const getDisplayText = (): string => {
        const option = PRICE_FILTER_OPTIONS.find(opt => opt.value === selectedPrice);
        return option?.label || 'All Events';
    };

    // Get count for a price type
    const getCountForType = (priceType: PriceFilterType): number | undefined => {
        if (!eventCounts) return undefined;

        switch (priceType) {
            case 'all':
                return eventCounts.total;
            case 'free':
                return eventCounts.free;
            case 'paid':
                return eventCounts.paid;
            default:
                return undefined;
        }
    };

    // Handle option selection
    const handleOptionSelect = (priceType: PriceFilterType) => {
        onPriceChange(priceType);
        setIsOpen(false);
    };

    return (
        <FilterContainer ref={dropdownRef} className={className}>
            <FilterButton
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                hasActiveFilter={selectedPrice !== 'all'}
                placeholder="All Events"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground hover:text-foreground transition-colors">{getDisplayText()}</span>
                </div>
            </FilterButton>

            <FilterDropdown isOpen={isOpen}>
                <div className="py-1">
                    {PRICE_FILTER_OPTIONS.map((option) => {
                        const count = getCountForType(option.value);
                        const isSelected = selectedPrice === option.value;

                        return (
                            <button
                                key={option.value}
                                onClick={() => handleOptionSelect(option.value)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none flex items-center justify-between ${isSelected ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-foreground'
                                    }`}
                            >
                                <span>{option.label}</span>
                                {count !== undefined && (
                                    <span className={`text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </FilterDropdown>
        </FilterContainer>
    );
} 