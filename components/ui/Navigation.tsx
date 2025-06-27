'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, Shield, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
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
            className={`xl:hidden absolute top-1 right-1 z-[60] flex items-center justify-center gap-1 rounded-full text-[10px] font-medium transition-all duration-300 ease-in-out cursor-pointer ${
                isExpanded 
                    ? (isAdmin 
                        ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm px-2 py-0.5' 
                        : 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm px-2 py-0.5')
                    : (isAdmin ? 'text-red-600' : 'text-blue-600')
            } ${isExpanded ? '' : 'w-6 h-6'}`}
            aria-label={`Current user role: ${isAdmin ? 'Administrator' : 'Staff member'}`}
            data-test-id="mobile-user-role-badge"
            onClick={handleInteraction}
            onMouseEnter={handleInteraction}
        >
            {isAdmin ? (
                <Settings className="w-2.5 h-2.5 flex-shrink-0 translate-x-[0.5px]" aria-hidden="true" />
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
                    {/* Left side - Logo with responsive text */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Link href="/" className="flex items-center gap-2 md:gap-4 min-w-0" data-test-id="homepage-logo">
                            <Image 
                                src="/logo.svg" 
                                alt="LocalLoop logo" 
                                width={200}
                                height={60}
                                className="h-8 md:h-10 w-auto flex-shrink-0" 
                            />
                            <span className="text-2xl md:text-3xl text-card-foreground min-[400px]:inline hidden whitespace-nowrap" data-test-id="homepage-title">LocalLoop</span>
                        </Link>
                        
                        {/* Admin/Staff Badge - Hidden on mobile and small tablets, shown on large screens */}
                        {user && (isAdmin || isStaff) && (
                            <div 
                                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
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
                                <span>
                                    {isAdmin ? 'Admin' : 'Staff'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right side - Navigation */}
                    <>
                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-3 xl:gap-6 flex-shrink-0" aria-label="Primary navigation" data-test-id="desktop-navigation">

                            {(isStaff || isAdmin) && (
                                <Link href="/staff" className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap" data-test-id="staff-link">
                                    Staff
                                </Link>
                            )}

                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/create-event"
                                    className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                                    data-test-id="create-event-link"
                                >
                                    Create Event
                                </Link>
                            )}

                            {user && (
                                <Link
                                    href="/my-events"
                                    className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                                    data-test-id="my-events-link"
                                >
                                    My Events
                                </Link>
                            )}

                            <button
                                onClick={handleBrowseEvents}
                                className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                                data-test-id="browse-events-button"
                            >
                                Browse Events
                            </button>

                            <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
                                <ThemeToggle />
                                {/* Auth state conditional rendering - Optimistic UI */}
                                {user ? (
                                    <ProfileDropdown testIdPrefix="desktop-" />
                                ) : (
                                    <Link
                                        href="/auth/login?force_logout=true"
                                        className={`bg-primary text-primary-foreground px-3 xl:px-4 py-2 rounded-lg hover:bg-primary/90 transition-all duration-200 text-sm whitespace-nowrap ${
                                            authLoading ? 'opacity-75 pointer-events-none' : 'opacity-100'
                                        }`}
                                        data-testid="sign-in-link"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </nav>

                        {/* Mobile/Tablet - Profile and Menu Button */}
                        <div className="lg:hidden flex items-center gap-1 min-w-0 flex-shrink-0">

                            {/* Theme Toggle for mobile/tablet */}
                            <div className="flex-shrink-0">
                                <ThemeToggle />
                            </div>
                            
                            {/* Always visible auth state in mobile/tablet top bar */}
                            {user ? (
                                <div className="flex-shrink-0">
                                    <ProfileDropdown 
                                        testIdPrefix="mobile-" 
                                        onOpenChange={(isOpen) => {
                                            if (isOpen) setIsMobileMenuOpen(false)
                                        }}
                                    />
                                </div>
                            ) : (
                                <Link
                                    href="/auth/login?force_logout=true"
                                    className={`bg-primary text-primary-foreground px-2 md:px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all duration-200 text-xs md:text-sm flex-shrink-0 whitespace-nowrap ${
                                        authLoading ? 'opacity-75 pointer-events-none' : 'opacity-100'
                                    }`}
                                    data-testid="mobile-sign-in-link"
                                >
                                    Sign In
                                </Link>
                            )}

                            {/* Mobile Menu Button with responsive sizing */}
                            <button
                                className="p-1.5 md:p-2 rounded-lg hover:bg-accent transition-colors flex-shrink-0"
                                onClick={handleMobileMenuToggle}
                                aria-label="Toggle mobile menu"
                                data-test-id="mobile-menu-button"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" aria-hidden="true" />
                                ) : (
                                    <Menu className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </>
                </div>

                {/* Mobile Navigation */}
                {(isMobileMenuOpen || isMenuAnimating) && (
                    <div 
                        className="lg:hidden border-t border-border py-4 transform transition-all duration-300 ease-out" 
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

                            {user && (
                                <Link
                                    href="/my-events"
                                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    data-test-id="mobile-my-events-link"
                                >
                                    My Events
                                </Link>
                            )}

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