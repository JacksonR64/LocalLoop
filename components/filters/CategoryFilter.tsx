'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Tag } from 'lucide-react';
import { FilterOption } from '@/lib/types/filters';
import { FilterButton, FilterDropdown, FilterContainer } from '@/components/ui/FilterButton';

interface CategoryFilterProps {
    selectedCategories: string[];
    availableCategories: FilterOption[];
    onChange: (categories: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function CategoryFilter({
    selectedCategories,
    availableCategories,
    onChange,
    placeholder = 'Select categories...',
    className = ''
}: CategoryFilterProps) {
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

    const handleCategoryToggle = (categoryValue: string) => {
        const newCategories = selectedCategories.includes(categoryValue)
            ? selectedCategories.filter(c => c !== categoryValue)
            : [...selectedCategories, categoryValue];

        onChange(newCategories);
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const getDisplayText = () => {
        if (selectedCategories.length === 0) return placeholder;
        if (selectedCategories.length === 1) {
            const category = availableCategories.find(c => c.value === selectedCategories[0]);
            return category?.label || selectedCategories[0];
        }
        return `${selectedCategories.length} categories selected`;
    };

    return (
        <FilterContainer ref={dropdownRef} className={className}>
            {/* Main Button */}
            <FilterButton
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                hasActiveFilter={selectedCategories.length > 0}
                placeholder={placeholder}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate text-muted-foreground hover:text-foreground transition-colors">
                            {getDisplayText()}
                        </span>
                    </div>
                    {selectedCategories.length > 0 && (
                        <div
                            onClick={clearSelection}
                            className="p-0.5 hover:bg-accent rounded ml-2 cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange([]);
                                }
                            }}
                            aria-label="Clear selection"
                        >
                            <X className="w-3 h-3 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </FilterButton>

            {/* Dropdown Menu */}
            <FilterDropdown isOpen={isOpen} className="max-h-60 overflow-auto">
                {availableCategories.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                        No categories available
                    </div>
                ) : (
                    <div className="py-1">
                        {availableCategories.map((category) => {
                            const isSelected = selectedCategories.includes(category.value);
                            return (
                                <button
                                    key={category.value}
                                    type="button"
                                    onClick={() => handleCategoryToggle(category.value)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent focus:outline-none focus:bg-accent"
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'border-border'
                                            }`}>
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="text-foreground">{category.label}</span>
                                    </div>
                                    {category.count !== undefined && (
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {category.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </FilterDropdown>
        </FilterContainer>
    );
} 