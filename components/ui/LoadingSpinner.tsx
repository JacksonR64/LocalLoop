import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export function LoadingSpinner({
    size = 'md',
    text,
    className = ''
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div
                className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-muted border-t-primary`}
                role="status"
                aria-label={text || "Loading"}
            />
            {text && (
                <p className={`mt-2 ${textSizeClasses[size]} text-muted-foreground`}>
                    {text}
                </p>
            )}
        </div>
    );
} 