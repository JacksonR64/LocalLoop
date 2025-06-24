"use client";

import { useState, useEffect, useCallback } from 'react';

interface UsePaginationProps<T> {
    data: T[];
    pageSize?: number;
    onLoadMore?: () => Promise<void>;
}

interface PaginationState {
    currentPage: number;
    isLoading: boolean;
    hasMore: boolean;
    error: string | null;
}

interface UsePaginationReturn<T> {
    paginatedData: T[];
    loadMore: () => void;
    reset: () => void;
    state: PaginationState;
}

export function usePagination<T>({
    data,
    pageSize = 12,
    onLoadMore
}: UsePaginationProps<T>): UsePaginationReturn<T> {
    const [state, setState] = useState<PaginationState>({
        currentPage: 1,
        isLoading: false,
        hasMore: true,
        error: null
    });

    // Calculate paginated data
    const paginatedData = data.slice(0, state.currentPage * pageSize);
    const hasMore = data.length > paginatedData.length;

    // Update hasMore when data or pageSize changes (not currentPage to avoid infinite loop)
    useEffect(() => {
        setState(prev => ({
            ...prev,
            hasMore: data.length > prev.currentPage * pageSize
        }));
    }, [data.length, pageSize]);

    // Load more data
    const loadMore = useCallback(async () => {
        if (state.isLoading || !hasMore) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // If onLoadMore is provided, call it (for real API calls)
            if (onLoadMore) {
                await onLoadMore();
            }

            // Increment page
            setState(prev => ({
                ...prev,
                currentPage: prev.currentPage + 1,
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load more data'
            }));
        }
    }, [state.isLoading, hasMore, onLoadMore]);

    // Reset pagination (useful when filters change)
    const reset = useCallback(() => {
        setState({
            currentPage: 1,
            isLoading: false,
            hasMore: true,
            error: null
        });
    }, []);

    // Reset when data array reference changes (e.g., when filters change)
    useEffect(() => {
        setState({
            currentPage: 1,
            isLoading: false,
            hasMore: true,
            error: null
        });
    }, [data]);

    return {
        paginatedData,
        loadMore,
        reset,
        state: {
            ...state,
            hasMore
        }
    };
} 