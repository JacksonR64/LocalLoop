import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LoadingProvider } from "@/lib/loading-context";
import { PerformanceMonitor } from "@/components/analytics/PerformanceMonitor";
import { ThemeProvider } from 'next-themes';
import { Navigation } from '@/components/ui/Navigation';
import { DevOnlyErrorFilter } from '@/components/utils/DevOnlyErrorFilter';
import { BrowserExtensionCleanup } from '@/components/utils/BrowserExtensionCleanup';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only preload primary font
  fallback: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: {
    default: "LocalLoop - Community Events Platform",
    template: "%s | LocalLoop"
  },
  description: "Discover and join local community events with seamless calendar integration. Connect with your community through workshops, social gatherings, and local activities.",
  keywords: ["local events", "community", "calendar", "meetups", "workshops", "social gatherings"],
  authors: [{ name: "LocalLoop Team" }],
  creator: "LocalLoop",
  publisher: "LocalLoop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://localloop.app",
    title: "LocalLoop - Community Events Platform",
    description: "Discover and join local community events with seamless calendar integration",
    siteName: "LocalLoop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LocalLoop - Community Events Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalLoop - Community Events Platform",
    description: "Discover and join local community events with seamless calendar integration",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  minimumScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/api/manifest" />
{(process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') && (
          <script 
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  if (typeof window !== 'undefined') {
                    const originalWarn = console.warn;
                    const originalError = console.error;
                    const originalLog = console.log;
                    
                    const shouldSuppress = function(msg) {
                      var message = (msg || '').toString();
                      
                      // Suppress Stripe.js development warnings (with exact pattern matching)
                      if (message.includes('[Stripe.js]')) {
                        return (
                          message.includes('If you are testing Apple Pay or Google Pay, you must serve this page over HTTPS') ||
                          message.includes('The following payment method types are not activated') ||
                          message.includes('link') && message.includes('paypal') && message.includes('not activated') ||
                          message.includes('You have not registered or verified the domain') ||
                          message.includes('apple_pay') && message.includes('not enabled in the Payment Element') ||
                          message.includes('will not work over HTTP') ||
                          message.includes('Please read https://stripe.com/docs/stripe-js/elements/payment-request-button') ||
                          message.includes('Please activate the payment method types in your dashboard') ||
                          message.includes('Please follow https://stripe.com/docs/payments/payment-methods/pmd-registration')
                        );
                      }
                      
                      // Suppress only non-functional Vercel Live errors (not React errors)
                      if (message.includes('vercel.live') ||
                          message.includes('feedback.js')) {
                        return true;
                      }
                      
                      // Keep other existing suppressions
                      var lowerMessage = message.toLowerCase();
                      return lowerMessage.includes('stripe.js') && (
                        lowerMessage.includes('appearance') ||
                        lowerMessage.includes('is not a supported property') ||
                        lowerMessage.includes('elements-inner-loader-ui.html')
                      );
                    };
                    
                    console.warn = function() {
                      var message = (arguments[0] || '').toString();
                      if (!shouldSuppress(message)) {
                        originalWarn.apply(console, arguments);
                      }
                    };
                    
                    console.error = function() {
                      var message = (arguments[0] || '').toString();
                      if (!shouldSuppress(message)) {
                        originalError.apply(console, arguments);
                      }
                    };
                    
                    console.log = function() {
                      var message = (arguments[0] || '').toString();
                      if (!shouldSuppress(message)) {
                        originalLog.apply(console, arguments);
                      }
                    };
                    
                    console.log('🔇 Early console filter initialized');
                  }
                })();
              `
            }}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground w-full overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <LoadingProvider position="top-right" delay={1000}>
            <AuthProvider>
              <DevOnlyErrorFilter />
              <BrowserExtensionCleanup />
              <Navigation />
              <main id="main-content" className="pt-16 w-full overflow-x-hidden">
                {children}
              </main>
            </AuthProvider>
          </LoadingProvider>
        </ThemeProvider>
        <PerformanceMonitor pageName="app" />
      </body>
    </html>
  );
}
