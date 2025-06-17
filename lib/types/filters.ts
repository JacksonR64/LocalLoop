// Event Filter Types and Interfaces

export interface DateRange {
    start: Date;
    end: Date;
}

export type PriceFilterType = 'all' | 'free' | 'paid';

export type SortOption =
    | 'date_asc'
    | 'date_desc'
    | 'title_asc'
    | 'title_desc'
    | 'price_asc'
    | 'price_desc';

export interface EventFilters {
    categories: string[];
    dateRange: DateRange | null;
    priceType: PriceFilterType;
    sortBy: SortOption;
    searchQuery?: string; // For future search functionality
}

export interface FilterOption {
    value: string;
    label: string;
    count?: number; // Number of events with this option
}

export interface SortOptionConfig {
    value: SortOption;
    label: string;
    icon?: string;
    tooltip: string;
}

export interface ActiveFilter {
    type: 'category' | 'dateRange' | 'priceType' | 'searchQuery';
    label: string;
    value: string | DateRange;
    removeFilter: () => void;
}

// Default filter state
export const DEFAULT_FILTERS: EventFilters = {
    categories: [],
    dateRange: null,
    priceType: 'all',
    sortBy: 'date_asc',
    searchQuery: '',
};

// Predefined date range options
export interface DateRangePreset {
    label: string;
    value: string;
    getRange: () => DateRange;
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
    {
        label: 'Today',
        value: 'today',
        getRange: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            return { start: today, end: endOfDay };
        }
    },
    {
        label: 'Tomorrow',
        value: 'tomorrow',
        getRange: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const endOfDay = new Date(tomorrow);
            endOfDay.setHours(23, 59, 59, 999);
            return { start: tomorrow, end: endOfDay };
        }
    },
    {
        label: 'This Week',
        value: 'this_week',
        getRange: () => {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            return { start: startOfWeek, end: endOfWeek };
        }
    },
    {
        label: 'This Weekend',
        value: 'this_weekend',
        getRange: () => {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const saturday = new Date(today);
            saturday.setDate(today.getDate() + (6 - dayOfWeek));
            saturday.setHours(0, 0, 0, 0);
            const sunday = new Date(saturday);
            sunday.setDate(saturday.getDate() + 1);
            sunday.setHours(23, 59, 59, 999);
            return { start: saturday, end: sunday };
        }
    },
    {
        label: 'This Month',
        value: 'this_month',
        getRange: () => {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            return { start: startOfMonth, end: endOfMonth };
        }
    },
    {
        label: 'Next 30 Days',
        value: 'next_30_days',
        getRange: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 30);
            endDate.setHours(23, 59, 59, 999);
            return { start: today, end: endDate };
        }
    }
];

// Sort options configuration
export const SORT_OPTIONS: SortOptionConfig[] = [
    {
        value: 'date_asc',
        label: 'Date ↑',
        tooltip: 'Sort by date, earliest first'
    },
    {
        value: 'date_desc',
        label: 'Date ↓',
        tooltip: 'Sort by date, latest first'
    },
    {
        value: 'title_asc',
        label: 'Title A-Z',
        tooltip: 'Sort by title, A to Z'
    },
    {
        value: 'title_desc',
        label: 'Title Z-A',
        tooltip: 'Sort by title, Z to A'
    },
    {
        value: 'price_asc',
        label: 'Price ↑',
        tooltip: 'Sort by price, low to high'
    },
    {
        value: 'price_desc',
        label: 'Price ↓',
        tooltip: 'Sort by price, high to low'
    }
];

// Price filter options
export const PRICE_FILTER_OPTIONS = [
    { value: 'all' as PriceFilterType, label: 'All Events' },
    { value: 'free' as PriceFilterType, label: 'Free Only' },
    { value: 'paid' as PriceFilterType, label: 'Paid Only' }
]; 