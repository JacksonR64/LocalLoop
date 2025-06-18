'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAuth as useAuthHook } from '@/lib/hooks/useAuth'
import { ProfileDropdown } from '@/components/auth/ProfileDropdown'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface NavigationProps {
    className?: string
}

export function Navigation({
    className = ''
}: NavigationProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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


    return (
        <header className={`bg-card shadow-sm border-b border-border sticky top-0 z-50 ${className}`} data-test-id="homepage-header">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Logo (always shown, always clickable home button) */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-card-foreground" data-test-id="homepage-title">LocalLoop</span>
                    </Link>

                    {/* Right side - Full Navigation (always shown) */}
                    <>
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6" data-test-id="desktop-navigation">
                            <button
                                onClick={handleBrowseEvents}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                data-test-id="browse-events-button"
                            >
                                Browse Events
                            </button>

                            {(isStaff || isAdmin) && (
                                <Link href="/staff" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Staff
                                </Link>
                            )}

                            <Link
                                href="/my-events"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                My Events
                            </Link>

                            <Link
                                href="/create-event"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                data-test-id="create-event-link"
                            >
                                Create Event
                            </Link>

                            <ThemeToggle />


                            {/* Auth state conditional rendering */}
                            {authLoading ? (
                                <div className="w-20 h-10 bg-muted animate-pulse rounded-lg" />
                            ) : user ? (
                                <ProfileDropdown />
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Sign In
                                </Link>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle mobile menu"
                            data-test-id="mobile-menu-button"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6 text-muted-foreground" />
                            ) : (
                                <Menu className="w-6 h-6 text-muted-foreground" />
                            )}
                        </button>
                    </>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-border py-4">
                        <nav className="flex flex-col space-y-4">
                            <button
                                onClick={() => {
                                    handleBrowseEvents()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors py-2 text-left"
                            >
                                Browse Events
                            </button>

                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/staff"
                                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Staff
                                </Link>
                            )}

                            <Link
                                href="/my-events"
                                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                My Events
                            </Link>

                            <Link
                                href="/create-event"
                                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Create Event
                            </Link>

                            <ThemeToggle />


                            {/* Auth state conditional rendering for mobile */}
                            {authLoading ? (
                                <div className="w-full h-12 bg-muted animate-pulse rounded-lg" />
                            ) : user ? (
                                <ProfileDropdown />
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className="bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors text-left"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
} 