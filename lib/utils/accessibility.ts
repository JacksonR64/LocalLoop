/**
 * Accessibility utilities for consistent screen reader support and ARIA implementation
 * Based on WCAG 2.1 AA guidelines and best practices
 */

/**
 * Generate consistent data-testid values
 */
export function generateTestId(component: string, variant?: string, action?: string): string {
    const parts = [component, variant, action].filter(Boolean)
    return parts.join('-').toLowerCase().replace(/\s+/g, '-')
}

/**
 * Screen reader only text component for providing additional context
 */
export function createScreenReaderText(text: string): string {
    return text
}

/**
 * Generate ARIA labels for common UI patterns
 */
export const ariaLabels = {
    // Navigation
    navigation: {
        primary: "Primary navigation",
        mobile: "Mobile navigation", 
        breadcrumb: "Breadcrumb navigation",
        pagination: "Pagination navigation",
        skipToMain: "Skip to main content"
    },
    
    // Forms
    forms: {
        required: "required",
        optional: "optional", 
        invalid: "invalid",
        valid: "valid",
        loading: "loading",
        search: "Search",
        filter: "Filter",
        sort: "Sort",
        clear: "Clear"
    },
    
    // Actions
    actions: {
        close: "Close",
        open: "Open", 
        toggle: "Toggle",
        expand: "Expand",
        collapse: "Collapse",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        submit: "Submit",
        reset: "Reset"
    },
    
    // States
    states: {
        loading: "Loading",
        error: "Error",
        success: "Success",
        warning: "Warning",
        selected: "selected",
        current: "current page",
        expanded: "expanded",
        collapsed: "collapsed"
    },
    
    // Events
    events: {
        card: "View event details",
        rsvp: "RSVP to event",
        addToCalendar: "Add event to calendar",
        share: "Share event",
        favorite: "Add to favorites",
        unfavorite: "Remove from favorites"
    }
} as const

/**
 * Generate accessible button text that includes visible text and screen reader context
 */
export function createAccessibleButtonText(visibleText: string, context?: string): string {
    if (!context) return visibleText
    return `${visibleText}, ${context}`
}

/**
 * Generate ARIA describedby IDs for form validation
 */
export function generateAriaDescribedBy(fieldName: string, type: 'hint' | 'error' | 'success'): string {
    return `${fieldName}-${type}`
}

/**
 * Create landmark region props
 */
export function createLandmarkProps(role: 'main' | 'banner' | 'contentinfo' | 'navigation' | 'search' | 'complementary', label?: string) {
    return {
        role,
        ...(label && { 'aria-label': label })
    }
}

/**
 * Generate accessible form field props
 */
export function createFormFieldProps(
    fieldName: string, 
    options: {
        required?: boolean
        invalid?: boolean
        hasHint?: boolean
        hasError?: boolean
        testId?: string
    } = {}
) {
    const { required, invalid, hasHint, hasError, testId } = options
    
    const describedBy = []
    if (hasHint) describedBy.push(generateAriaDescribedBy(fieldName, 'hint'))
    if (hasError) describedBy.push(generateAriaDescribedBy(fieldName, 'error'))
    
    return {
        'aria-required': required || undefined,
        'aria-invalid': invalid || undefined,
        'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
        'data-testid': testId || generateTestId('field', fieldName)
    }
}

/**
 * Create accessible dialog props
 */
export function createDialogProps(title: string, description?: string) {
    return {
        'aria-labelledby': `${title.toLowerCase().replace(/\s+/g, '-')}-title`,
        'aria-describedby': description ? `${title.toLowerCase().replace(/\s+/g, '-')}-description` : undefined,
        role: 'dialog',
        'aria-modal': true
    }
}

/**
 * Create accessible list props for dynamic lists
 */
export function createListProps(label: string, itemCount?: number) {
    return {
        'aria-label': itemCount !== undefined ? `${label}, ${itemCount} items` : label,
        role: 'list'
    }
}

/**
 * Generate status announcements for screen readers
 */
export function createStatusMessage(type: 'success' | 'error' | 'info' | 'warning', message: string): string {
    const prefixes = {
        success: 'Success:',
        error: 'Error:',
        info: 'Information:',
        warning: 'Warning:'
    }
    
    return `${prefixes[type]} ${message}`
}

/**
 * Keyboard event utilities
 */
export const keyboardUtils = {
    isEnterOrSpace: (event: React.KeyboardEvent) => 
        event.key === 'Enter' || event.key === ' ',
    
    isEscape: (event: React.KeyboardEvent) => 
        event.key === 'Escape',
    
    isArrowKey: (event: React.KeyboardEvent) => 
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key),
    
    preventDefaultAndStopPropagation: (event: React.KeyboardEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }
}

/**
 * Focus management utilities
 */
export const focusUtils = {
    trapFocus: (container: HTMLElement) => {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
        
        return {
            focusFirst: () => firstElement?.focus(),
            focusLast: () => lastElement?.focus(),
            handleTabKey: (event: KeyboardEvent) => {
                if (event.key !== 'Tab') return
                
                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        event.preventDefault()
                        lastElement?.focus()
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        event.preventDefault()
                        firstElement?.focus()
                    }
                }
            }
        }
    }
}