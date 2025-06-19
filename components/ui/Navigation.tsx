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
                    {/* Left side - Logo and Admin/Staff Badge */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <Image 
                                src="/logo.svg" 
                                alt="LocalLoop" 
                                width={48}
                                height={48}
                                className="w-12 h-12" 
                            />
                            <span className="text-xl font-bold text-card-foreground" data-test-id="homepage-title">LocalLoop</span>
                        </Link>
                        
                        {/* Admin/Staff Badge */}
                        {user && (isAdmin || isStaff) && (
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                isAdmin 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                                {isAdmin ? (
                                    <Settings className="w-3 h-3" />
                                ) : (
                                    <Shield className="w-3 h-3" />
                                )}
                                <span className="hidden sm:inline">
                                    {isAdmin ? 'Admin' : 'Staff'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right side - Full Navigation (always shown) */}
                    <>
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6" data-test-id="desktop-navigation">
                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/create-event"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    data-test-id="create-event-link"
                                >
                                    Create Event
                                </Link>
                            )}

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

                            <button
                                onClick={handleBrowseEvents}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                data-test-id="browse-events-button"
                            >
                                Browse Events
                            </button>

                            <ThemeToggle />


                            {/* Auth state conditional rendering - Optimistic UI */}
                            {user ? (
                                <ProfileDropdown />
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className={`bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all duration-200 ${
                                        authLoading ? 'opacity-75 pointer-events-none' : 'opacity-100'
                                    }`}
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
                        {/* Mobile Admin/Staff Badge */}
                        {user && (isAdmin || isStaff) && (
                            <div className="mb-4 flex justify-center">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                                    isAdmin 
                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                    {isAdmin ? (
                                        <Settings className="w-4 h-4" />
                                    ) : (
                                        <Shield className="w-4 h-4" />
                                    )}
                                    <span>{isAdmin ? 'Admin' : 'Staff'}</span>
                                </div>
                            </div>
                        )}
                        
                        <nav className="flex flex-col space-y-4">
                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/create-event"
                                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Create Event
                                </Link>
                            )}

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

                            <button
                                onClick={() => {
                                    handleBrowseEvents()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors py-2 text-left"
                            >
                                Browse Events
                            </button>

                            <ThemeToggle />


                            {/* Auth state conditional rendering for mobile - Optimistic UI */}
                            {user ? (
                                <ProfileDropdown />
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className={`bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-all duration-200 text-left ${
                                        authLoading ? 'opacity-75 pointer-events-none' : 'opacity-100'
                                    }`}
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