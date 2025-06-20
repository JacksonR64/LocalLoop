import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
    return (
        <footer className="bg-muted border-t mt-20" data-test-id="homepage-footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <Link href="/" className="flex items-center justify-center mb-4" data-test-id="footer-logo">
                        <Image 
                            src="/logo.svg" 
                            alt="LocalLoop" 
                            width={48}
                            height={48}
                            className="w-12 h-12" 
                        />
                        <span className="ml-2 text-xl font-bold text-foreground" data-test-id="footer-title">LocalLoop</span>
                    </Link>
                    <p className="text-muted-foreground mb-6" data-test-id="footer-description">
                        Connecting communities through local events
                    </p>
                    <div className="flex justify-center gap-6 text-sm" data-test-id="footer-links">
                        <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors" data-test-id="footer-about-link">About</Link>
                        <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors" data-test-id="footer-privacy-link">Privacy</Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors" data-test-id="footer-terms-link">Terms</Link>
                        <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors" data-test-id="footer-contact-link">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
} 