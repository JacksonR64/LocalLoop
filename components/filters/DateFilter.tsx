'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { DateRange, DATE_RANGE_PRESETS } from '@/lib/types/filters';
import { FilterButton, FilterDropdown, FilterContainer } from '@/components/ui/FilterButton';

interface DateFilterProps {
    selectedRange: DateRange | null;
    onRangeChange: (range: DateRange | null) => void;
    className?: string;
}

export function DateFilter({ selectedRange, onRangeChange, className = '' }: DateFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
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

    // Format date for display
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    // Get display text for current selection
    const getDisplayText = (): string => {
        if (!selectedRange) return 'Any date';

        // Check if it matches a preset
        const preset = DATE_RANGE_PRESETS.find(preset => {
            const presetRange = preset.getRange();
            return Math.abs(presetRange.start.getTime() - selectedRange.start.getTime()) < 1000 &&
                Math.abs(presetRange.end.getTime() - selectedRange.end.getTime()) < 1000;
        });

        if (preset) {
            return preset.label;
        }

        // Custom range
        return `${formatDate(selectedRange.start)} - ${formatDate(selectedRange.end)}`;
    };

    // Handle preset selection
    const handlePresetSelect = (preset: typeof DATE_RANGE_PRESETS[0]) => {
        const range = preset.getRange();
        onRangeChange(range);
        setIsOpen(false);
    };

    // Handle custom date range
    const handleCustomRange = () => {
        if (!customStart || !customEnd) return;

        const startDate = new Date(customStart);
        const endDate = new Date(customEnd);

        // Ensure start is before end
        if (startDate > endDate) {
            return;
        }

        // Set proper time bounds
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        onRangeChange({ start: startDate, end: endDate });
        setIsOpen(false);
    };

    // Clear selection
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRangeChange(null);
        setCustomStart('');
        setCustomEnd('');
    };

    // Initialize custom date inputs with current selection
    useEffect(() => {
        if (selectedRange) {
            setCustomStart(selectedRange.start.toISOString().split('T')[0]);
            setCustomEnd(selectedRange.end.toISOString().split('T')[0]);
        }
    }, [selectedRange]);

    return (
        <FilterContainer ref={dropdownRef} className={className}>
            <FilterButton
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                hasActiveFilter={!!selectedRange}
                placeholder="Any date"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground hover:text-foreground transition-colors">{getDisplayText()}</span>
                    </div>
                    {selectedRange && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground ml-2"
                            aria-label="Clear date filter"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </FilterButton>

            <FilterDropdown isOpen={isOpen}>
                <div className="py-1">
                    {/* Preset Options */}
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
                        Quick Select
                    </div>
                    {DATE_RANGE_PRESETS.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => handlePresetSelect(preset)}
                            className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent focus:bg-accent focus:outline-none"
                        >
                            {preset.label}
                        </button>
                    ))}

                    {/* Custom Date Range */}
                    <div className="border-t border-border pt-2">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Custom Range
                        </div>
                        <div className="px-3 pb-3 space-y-2">
                            <div>
                                <label htmlFor="date-filter-start" className="block text-xs text-muted-foreground mb-1">Start Date</label>
                                <input
                                    id="date-filter-start"
                                    name="date-filter-start"
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                    aria-label="Select start date for event filter"
                                />
                            </div>
                            <div>
                                <label htmlFor="date-filter-end" className="block text-xs text-muted-foreground mb-1">End Date</label>
                                <input
                                    id="date-filter-end"
                                    name="date-filter-end"
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    min={customStart}
                                    className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                    aria-label="Select end date for event filter"
                                />
                            </div>
                            <button
                                onClick={handleCustomRange}
                                disabled={!customStart || !customEnd}
                                className="w-full px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                            >
                                Apply Range
                            </button>
                        </div>
                    </div>
                </div>
            </FilterDropdown>
        </FilterContainer>
    );
} 