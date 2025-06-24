'use client'

import React, { createContext, useContext, useState } from 'react'

interface SearchContextType {
  isSearchOpen: boolean
  isSearchAnimating: boolean
  searchAnimationType: 'enter' | 'exit'
  toggleSearch: () => void
  closeSearch: (byEnter?: boolean) => void
  scrollToEvents: () => void
  onSearchToggle?: (wasClosedByEnter: boolean) => void
  setOnSearchToggle: (callback: (wasClosedByEnter: boolean) => void) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearchAnimating, setIsSearchAnimating] = useState(false)
  const [searchAnimationType, setSearchAnimationType] = useState<'enter' | 'exit'>('enter')
  const [onSearchToggle, setOnSearchToggleCallback] = useState<((wasClosedByEnter: boolean) => void) | undefined>(undefined)

  const toggleSearch = () => {
    const wasOpen = isSearchOpen;
    
    if (!wasOpen) {
      // Opening search - trigger enter animation
      setSearchAnimationType('enter')
      setIsSearchOpen(true);
      setIsSearchAnimating(true)
      
      // Animation complete - no auto-scroll on open
      setTimeout(() => {
        setIsSearchAnimating(false)
      }, 300);
    } else {
      closeSearch(false); // Manual toggle, not by Enter
    }
  }
  
  const closeSearch = (byEnter: boolean = false) => {
    if (isSearchOpen) {
      // Notify parent about how the search was closed
      if (onSearchToggle) {
        onSearchToggle(byEnter);
      }
      
      // Trigger exit animation
      setSearchAnimationType('exit')
      setIsSearchAnimating(true)
      setTimeout(() => {
        setIsSearchOpen(false);
        setIsSearchAnimating(false)
      }, 300);
    }
  }

  const scrollToEvents = () => {
    const upcomingEventsSection = document.getElementById('upcoming-events');
    if (upcomingEventsSection) {
      const searchBarHeight = 80; // Approximate height of search bar
      const targetPosition = upcomingEventsSection.offsetTop - searchBarHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }

  const setOnSearchToggle = (callback: (wasClosedByEnter: boolean) => void) => {
    setOnSearchToggleCallback(() => callback);
  };

  return (
    <SearchContext.Provider value={{ 
      isSearchOpen, 
      isSearchAnimating, 
      searchAnimationType, 
      toggleSearch, 
      closeSearch, 
      scrollToEvents,
      onSearchToggle,
      setOnSearchToggle
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}