/* eslint-disable @typescript-eslint/no-require-imports */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
      {
        protocol: 'https',
        hostname: 'cdnjs.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'imgs.search.brave.com',
      },
    ],
  },

  // Enable compression
  compress: true,

  // PoweredBy header removal for security
  poweredByHeader: false,

  // Enable source maps for production debugging and Lighthouse analysis
  productionBrowserSourceMaps: true,

  // Headers for security, performance and caching
  async headers() {
    return [
      {
        // Security headers for all pages
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? 'camera=(), microphone=(), geolocation=(), gyroscope=(), magnetometer=(), payment=*'
              : 'camera=(), microphone=(), geolocation=(), gyroscope=(), magnetometer=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com" "https://api.stripe.com" "https://hooks.stripe.com" "https://r.stripe.com")'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview')
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com; connect-src 'self' https://api.stripe.com https://r.stripe.com https://q.stripe.com https://m.stripe.com https://b.stripe.com https://js.stripe.com https://merchant-ui-api.stripe.com https://checkout.stripe.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://jbyuivzpetgbapisbnxy.supabase.co https://*.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com; style-src 'self' 'unsafe-inline' https://js.stripe.com; img-src 'self' data: https: https://*.stripe.com; font-src 'self' data: https://js.stripe.com; object-src 'none'; base-uri 'self'; manifest-src 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com; connect-src 'self' https://api.stripe.com https://r.stripe.com https://q.stripe.com https://m.stripe.com https://b.stripe.com https://js.stripe.com https://merchant-ui-api.stripe.com https://checkout.stripe.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://jbyuivzpetgbapisbnxy.supabase.co https://*.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com; style-src 'self' 'unsafe-inline' https://js.stripe.com; img-src 'self' data: https: https://*.stripe.com; font-src 'self' data: https://js.stripe.com; object-src 'none'; base-uri 'self'; manifest-src 'self';"
          }
        ],
      },
      {
        // Additional security for authentication pages
        source: '/auth/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex'
          }
        ],
      },
      {
        // API security headers
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ],
      },
      {
        // Cache static assets for 1 year
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        // Cache API responses briefly
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300'
          },
        ],
      },
    ];
  },

  // Force consistent port and set dynamic environment
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'production'
      ? 'https://localloopevents.xyz'
      : 'http://localhost:3000',
  },

  // Webpack optimizations for performance
  webpack: (config, { dev, isServer }) => {
    // Suppress Supabase realtime-js warnings
    const ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@supabase\/realtime-js/, message: /Critical dependency: the request of a dependency is an expression/ },
      { module: /realtime-js/, message: /Critical dependency: the request of a dependency is an expression/ },
    ];
    config.ignoreWarnings = ignoreWarnings;

    // Handle client-side only libraries
    if (isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'leaflet': false,
        'react-leaflet': false,
        'web-vitals': false,
        '@vercel/analytics': false,
        '@stripe/stripe-js': false,
        '@stripe/react-stripe-js': false,
      }

      // Also exclude from externals
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push(
          'leaflet',
          'react-leaflet',
          'web-vitals',
          '@vercel/analytics',
          '@stripe/stripe-js',
          '@stripe/react-stripe-js'
        )
      }
    }

    // Enhanced optimizations for both dev and production
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
        minimize: !dev, // Only minimize in production
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          cacheGroups: {
            // Separate Stripe into its own chunk for lazy loading
            stripe: {
              test: /[\\/]node_modules[\\/]@stripe/,
              name: 'stripe',
              chunks: 'all',
              maxSize: 150000,
              priority: 20,
            },
            // Separate large UI libraries
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui/,
              name: 'radix-ui',
              chunks: 'all',
              maxSize: 100000,
              priority: 15,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 200000, // Reduced from 244KB
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              maxSize: 150000, // Reduced from 244KB
              priority: 5,
            },
          },
        },
      }
    }

    // Performance optimizations for all builds (removed problematic React aliasing)
    // Note: React aliasing was causing module resolution issues with jsx-runtime

    // Bundle analyzer in development (optional)
    if (dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }

    return config;
  },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-select',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      '@supabase/ssr',
    ],
  },

  // Server external packages for better tree shaking
  serverExternalPackages: ['@supabase/supabase-js'],

  // Turbopack configuration - properly typed resolveAlias
  turbopack: {
    resolveAlias: {
      // Use empty modules instead of false for proper typing
      'react-leaflet': require.resolve('./lib/utils/empty-module.js'),
      'leaflet': require.resolve('./lib/utils/empty-module.js'),
      // Additional client-side only libraries
      'web-vitals': require.resolve('./lib/utils/empty-module.js'),
      '@vercel/analytics': require.resolve('./lib/utils/empty-module.js'),
      '@stripe/stripe-js': require.resolve('./lib/utils/empty-module.js'),
      '@stripe/react-stripe-js': require.resolve('./lib/utils/empty-module.js'),
    },
  },
};

export default nextConfig;
