"use client";

import React from 'react';

interface SectionToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  showText: string;
  hideText: string;
  className?: string;
}

export function SectionToggle({ 
  isVisible, 
  onToggle, 
  showText, 
  hideText, 
  className = "" 
}: SectionToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`text-muted-foreground hover:text-foreground font-medium text-left sm:text-right transition-colors ${className}`}
      data-testid="section-toggle-button"
    >
      {isVisible ? hideText : showText} {isVisible ? '↑' : '↓'}
    </button>
  );
}