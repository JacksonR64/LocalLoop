import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface LightweightModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function LightweightModal({ 
    open, 
    onOpenChange, 
    children, 
    title,
    description,
    maxWidth = 'lg'
}: LightweightModalProps) {
    // Scroll locking disabled to allow background page scrolling
    // useEffect(() => {
    //     if (open) {
    //         // Store original overflow and padding-right to restore later
    //         const originalOverflow = document.body.style.overflow;
    //         const originalPaddingRight = document.body.style.paddingRight;
    //         
    //         // Calculate scrollbar width to prevent layout shift
    //         const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    //         
    //         // Apply scroll lock
    //         document.body.style.overflow = 'hidden';
    //         document.body.style.paddingRight = `${scrollbarWidth}px`;
    //         
    //         // Cleanup function to restore original styles
    //         return () => {
    //             document.body.style.overflow = originalOverflow;
    //             document.body.style.paddingRight = originalPaddingRight;
    //         };
    //     }
    // }, [open]);

    if (!open) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onOpenChange(false);
        }
    };

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md', 
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl'
    };

    return (
        <>
            {/* Minimal backdrop - very light to keep site visible */}
            <div 
                className="fixed inset-0 bg-black/10 z-40"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />
            
            {/* Modal content positioned to allow topnav/footer access */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-20 px-4 pointer-events-none">
                <div 
                    className={`
                        ${maxWidthClasses[maxWidth]} 
                        w-full
                        bg-background/95 
                        backdrop-blur-md 
                        border border-border/20
                        rounded-xl 
                        shadow-2xl 
                        pointer-events-auto
                        max-h-[calc(100vh-10rem)]
                        overflow-y-auto
                        transform transition-all duration-300 ease-out
                        opacity-100 translate-y-0
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || description) && (
                        <div className="flex items-start justify-between p-6 border-b border-border/10">
                            <div className="flex-1">
                                {title && (
                                    <h2 className="text-lg font-semibold text-foreground mb-1">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="ml-4 p-1 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    
                    {/* Close button when no header */}
                    {!title && !description && (
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors z-10"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    
                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}

