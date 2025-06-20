'use client'

import React, { createContext, useContext, useState } from 'react'

interface SearchContextType {
  isSearchOpen: boolean
  toggleSearch: () => void
  closeSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const toggleSearch = () => setIsSearchOpen(prev => !prev)
  const closeSearch = () => setIsSearchOpen(false)

  return (
    <SearchContext.Provider value={{ isSearchOpen, toggleSearch, closeSearch }}>
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