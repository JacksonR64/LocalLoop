'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, Shield, Settings, Search } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useSearch } from '@/lib/search-context'
import { useAuth as useAuthHook } from '@/lib/hooks/useAuth'
import { ProfileDropdown } from '@/components/auth/ProfileDropdown'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// Mobile Role Badge Component with hover/click expansion
function MobileRoleBadge({ isAdmin }: { isAdmin: boolean }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null);

    const handleInteraction = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        setIsExpanded(true);
        
        const newTimeoutId = setTimeout(() => {
            setIsExpanded(false);
        }, 5000);
        
        setTimeoutId(newTimeoutId);
    };

    React.useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return (
        <div 
            className={`md:hidden absolute top-1 right-1 z-[60] flex items-center gap-1 rounded-full text-[10px] font-medium shadow-sm transition-all duration-300 ease-in-out cursor-pointer ${
                isAdmin 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
            } ${isExpanded ? 'px-2 py-0.5' : 'p-1'}`}
            aria-label={`Current user role: ${isAdmin ? 'Administrator' : 'Staff member'}`}
            data-test-id="mobile-user-role-badge"
            onClick={handleInteraction}
            onMouseEnter={handleInteraction}
        >
            {isAdmin ? (
                <Settings className="w-2.5 h-2.5 flex-shrink-0" aria-hidden="true" />
            ) : (
                <Shield className="w-2.5 h-2.5 flex-shrink-0" aria-hidden="true" />
            )}
            <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                isExpanded ? 'max-w-[50px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'
            }`}>
                {isAdmin ? 'Admin' : 'Staff'}
            </span>
        </div>
    );
}

interface NavigationProps {
    className?: string
}

export function Navigation({
    className = ''
}: NavigationProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMenuAnimating, setIsMenuAnimating] = useState(false)
    const [menuAnimationType, setMenuAnimationType] = useState<'enter' | 'exit'>('enter')
    const { user, loading: authLoading } = useAuth()
    const { isStaff, isAdmin } = useAuthHook()
    const { isSearchOpen, toggleSearch } = useSearch()
    const router = useRouter()

    // Handle navigation click for browse events
    const handleBrowseEvents = () => {
        router.push('/')
        // If on homepage, scroll to events section
        setTimeout(() => {
            const eventsSection = document.getElementById('upcoming-events')
            if (eventsSection) {
                eventsSection.scrollIntoView({ behavior: 'smooth' })
            }
        }, 100)
    }

    // Handle search toggle (keep mobile menu open)
    const handleSearchToggle = () => {
        toggleSearch()
    }

    const handleMobileMenuToggle = () => {
        if (isMobileMenuOpen) {
            // Trigger exit animation
            setMenuAnimationType('exit')
            setIsMenuAnimating(true)
            setTimeout(() => {
                setIsMobileMenuOpen(false)
                setIsMenuAnimating(false)
            }, 300) // Match animation duration
        } else {
            // Trigger enter animation
            setMenuAnimationType('enter')
            setIsMobileMenuOpen(true)
            setIsMenuAnimating(true)
            setTimeout(() => {
                setIsMenuAnimating(false)
            }, 300) // Match animation duration
        }
    }


    return (
        <>
            {/* Skip link for keyboard navigation */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:z-[60] focus:outline-none focus:ring-2 focus:ring-ring"
                data-test-id="skip-to-main-content"
            >
                Skip to main content
            </a>
            <header className={`bg-card shadow-sm border-b border-border fixed top-0 left-0 right-0 z-50 ${className}`} data-test-id="homepage-header">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Logo only on mobile, Logo + Badge on desktop */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2" data-test-id="homepage-logo">
                            <Image 
                                src="/logo.svg" 
                                alt="LocalLoop logo" 

                                width={48}
                                height={48}
                                className="w-12 h-12" 
                            />
                            <span className="text-xl font-bold text-card-foreground min-[400px]:inline hidden" data-test-id="homepage-title">LocalLoop</span>
                        </Link>
                        
                        {/* Admin/Staff Badge - Hidden on mobile, shown on desktop */}
                        {user && (isAdmin || isStaff) && (
                            <div 
                                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    isAdmin 
                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}
                                aria-label={`Current user role: ${isAdmin ? 'Administrator' : 'Staff member'}`}
                                data-test-id="user-role-badge"
                            >
                                {isAdmin ? (
                                    <Settings className="w-3 h-3" aria-hidden="true" />
                                ) : (
                                    <Shield className="w-3 h-3" aria-hidden="true" />
                                )}
                                <span className="hidden sm:inline">
                                    {isAdmin ? 'Admin' : 'Staff'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right side - Navigation */}
                    <>
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation" data-test-id="desktop-navigation">

                            {(isStaff || isAdmin) && (
                                <Link href="/staff" className="text-muted-foreground hover:text-foreground transition-colors" data-test-id="staff-link">
                                    Staff
                                </Link>
                            )}

                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/create-event"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    data-test-id="create-event-link"
                                >
                                    Create Event
                                </Link>
                            )}

                            <Link
                                href="/my-events"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                data-test-id="my-events-link"
                            >
                                My Events
                            </Link>

                            <button
                                onClick={handleBrowseEvents}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                data-test-id="browse-events-button"
                            >
                                Browse Events
                            </button>

                            {/* Search Toggle Button */}
                            <button
                                onClick={handleSearchToggle}
                                className={`p-2 rounded-lg transition-colors ${
                                    isSearchOpen 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}
                                aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                                data-test-id="search-toggle-button"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            <ThemeToggle />
                            {/* Auth state conditional rendering - Optimistic UI */}
                            {user ? (
                                <ProfileDropdown 
                                    testIdPrefix="desktop-" 
                                    onOpenChange={(isOpen) => {
                                        if (isOpen && isSearchOpen) {
                                            toggleSearch()
                                        }
                                    }}
                                />
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className={`bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all duration-200 ${
                                        authLoading ? 'opacity-75 pointer-events-none' : 'opacity-100'
                                    }`}
                                    data-testid="sign-in-link"
                                >
                                    Sign In
                                </Link>
                            )}
                        </nav>

                        {/* Mobile - Search, Profile and Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            {/* Mobile Search Toggle Button - Always visible */}
                            <button
                                onClick={handleSearchToggle}
                                className={`p-2 rounded-lg transition-colors ${
                                    isSearchOpen 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}
                                aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                                data-test-id="mobile-search-toggle-button"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            {/* Theme Toggle for mobile */}
                            <ThemeToggle />
                            
                            {/* Always visible auth state in mobile top bar */}
                            {user ? (
                                <ProfileDropdown 
                                    testIdPrefix="mobile-" 
                                    mobileIconOnly={true}
                                    onOpenChange={(isOpen) => {
                                        if (isOpen) {
                                            setIsMobileMenuOpen(false)
                                            if (isSearchOpen) toggleSearch()
                                        }
                                    }}
                                />
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className={`bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all duration-200 text-sm ${
                                        authLoading ? 'opacity-75 pointer-events-none' : 'opacity-100'
                                    }`}
                                    data-testid="mobile-sign-in-link"
                                >
                                    Sign In
                                </Link>
                            )}

                            {/* Mobile Menu Button with symmetrical padding */}
                            <button
                                className="p-2 rounded-lg hover:bg-accent transition-colors mr-1"
                                onClick={handleMobileMenuToggle}
                                aria-label="Toggle mobile menu"
                                data-test-id="mobile-menu-button"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                                ) : (
                                    <Menu className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </>
                </div>

                {/* Mobile Navigation */}
                {(isMobileMenuOpen || isMenuAnimating) && (
                    <div 
                        className="md:hidden border-t border-border py-4 transform transition-all duration-300 ease-out" 
                        data-test-id="mobile-navigation"
                        style={{
                            animation: menuAnimationType === 'enter' 
                                ? 'slideInFromTop 300ms ease-out forwards' 
                                : 'slideOutToTop 300ms ease-out forwards'
                        }}
                    >
                        <nav className="flex flex-col space-y-4" aria-label="Mobile navigation">
                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/staff"
                                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-test-id="mobile-staff-link"
                                >
                                    Staff
                                </Link>
                            )}

                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/create-event"
                                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-test-id="mobile-create-event-link"
                                >
                                    Create Event
                                </Link>
                            )}

                            <Link
                                href="/my-events"
                                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                                data-test-id="mobile-my-events-link"
                            >
                                My Events
                            </Link>

                            <button
                                onClick={() => {
                                    handleBrowseEvents()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors py-2 text-left"
                                data-test-id="mobile-browse-events-button"
                            >
                                Browse Events
                            </button>
                        </nav>
                    </div>
                )}
            </div>
            
            {/* Admin/Staff Badge - Mobile Only, positioned within header */}
            {user && (isAdmin || isStaff) && (
                <MobileRoleBadge isAdmin={isAdmin} />
            )}
        </header>
        </>
    )
} 