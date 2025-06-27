'use client'

import React, { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme, resolvedTheme } = useTheme()

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    // If not mounted yet, return a placeholder to prevent hydration mismatch
    if (!mounted) {
        return (
            <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                <Moon className="w-5 h-5 text-muted-foreground" />
            </button>
        )
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Toggle theme"
        >
            {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
            ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
            )}
        </button>
    )
} 