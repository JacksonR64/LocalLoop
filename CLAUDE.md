# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server
- `npm run build` - Production build with type checking
- `npm run lint` - ESLint checking
- `npm run type-check` - TypeScript validation

### Testing Suite
- `npm test` - Unit tests with Jest
- `npm run test:ci` - CI testing with coverage
- `npm run test:e2e` - Playwright E2E tests (Chrome, Firefox, Safari, Mobile)
- `npm run test:cross-browser` - Multi-browser testing
- `npm run coverage` - Generate test coverage reports

### Single Test Execution
- `npm test -- --testNamePattern="test name"` - Run specific Jest test
- `npx playwright test tests/specific-test.spec.ts` - Run specific E2E test

### Testing Credentials
- **Email/Password**: `jackson_rhoden@outlook.com` / `numfIt-8rorpo-fumwym`
- **Google OAuth**: `jacksonrhoden64@googlemail.com`
- **Test Events**: `/events/75c8904e-671f-426c-916d-4e275806e277`

## Architecture Overview

### Tech Stack
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict mode
- **Supabase** for database, auth, and real-time features
- **Stripe** for payment processing with webhooks
- **Google Calendar API** integration (primary client requirement)
- **Tailwind CSS** + **Shadcn/UI** components

### Key Directory Structure
```
/app/                      # Next.js App Router pages
├── api/                   # API routes (auth, events, calendar, checkout, webhooks)
├── events/                # Event discovery and details
├── staff/                 # Staff dashboard
└── auth/                  # Authentication pages

/components/
├── ui/                    # Shadcn/UI base components
├── auth/                  # Authentication components
├── events/                # Event-specific components
└── dashboard/             # Dashboard components

/lib/
├── database/             # Schema, migrations, types
├── auth.ts              # Authentication logic
├── google-calendar.ts   # Google Calendar integration
├── stripe.ts            # Stripe integration
└── supabase.ts          # Supabase client configuration
```

### Authentication & Security
- **Supabase Auth** with Google OAuth 2.0
- **Row Level Security (RLS)** policies on all database tables
- **Middleware protection** for `/dashboard`, `/profile`, `/admin` routes
- **Google Calendar tokens** encrypted and stored securely
- User roles: `user`, `organizer`, `admin`

### Database Architecture
- **PostgreSQL** via Supabase with real-time subscriptions
- **Migrations** in `/lib/database/migrations/`
- **Type generation** from database schema
- **RLS policies** for multi-tenant security

### Google Calendar Integration
This is a **primary client requirement**:
- **OAuth 2.0 flow** with PKCE for security
- **Token refresh** handling with encryption
- **Two-way sync**: create, update, delete events
- **Fallback to .ics files** when OAuth unavailable
- Implementation in `/lib/google-calendar.ts`

### Payment Processing
- **Stripe Checkout** integration
- **Webhook handling** with signature verification at `/api/webhooks/stripe`
- **Multiple ticket types** with pricing and capacity
- **Refund system** with automated processing

### Testing Strategy
- **Unit tests**: Jest with jsdom environment
- **E2E tests**: Playwright across Chrome, Firefox, Safari, Mobile
- **Load testing**: K6 configuration available
- **Coverage reporting**: HTML, LCOV, JSON formats
- Tests run in parallel for CI optimization

#### Test Coverage Requirements
- **CRITICAL**: 100% coverage for payment flows (Stripe integration)
- **CRITICAL**: 100% coverage for RSVP flows (including Google Calendar)
- **Comprehensive E2E tests** with Playwright for complete user journeys
- **Unit tests** for all utility functions and API routes

#### Test Patterns
```typescript
// E2E test structure
test('RSVP flow with Google Calendar integration', async ({ page }) => {
  await page.goto('/events/test-event');
  await page.click('[data-testid="rsvp-button"]');
  await page.click('[data-testid="add-to-calendar"]');
  // Verify complete user journey
});
```

### Development Rules & Patterns

#### Code Style & Structure
- **TypeScript Standards**: Use strict mode, define interfaces for all data structures, implement proper error handling with typed errors
- **File Organization**: Use lowercase with dashes for directories (e.g., `components/auth-wizard`)
- **Component Patterns**: Use functional and declarative programming patterns, avoid classes, use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- **Code Length**: Don't create files longer than 300 lines (split into modules)

#### Next.js 15 App Router Patterns
- Use App Router (`app/` directory) exclusively
- Server Components by default, Client Components only when needed
- Minimize use of `'use client'`, `useEffect`, and `setState`
- Implement proper SEO with metadata API
- Use dynamic imports for code splitting and optimization

#### Supabase Integration (CRITICAL)
- **ALWAYS use @supabase/ssr** for Next.js integration
- **NEVER use deprecated @supabase/auth-helpers-nextjs**
- **CRITICAL**: Use ONLY `getAll` and `setAll` cookie methods
- **NEVER use** individual cookie methods (`get`, `set`, `remove`)
- Use Row-Level Security (RLS) policies for all tables
- Implement proper database types with `supabase gen types typescript`

#### Component Patterns
- Use Shadcn/ui for base components with semantic Tailwind classes
- Text color logic: `className={hasActiveFilter ? 'text-foreground' : 'text-muted-foreground'}`
- Implement proper loading states and optimistic updates
- Use react-hook-form with Zod validation for forms
- Design for touch-friendly mobile interaction (44px minimum)

#### Error Handling & Security
- Use early returns for error conditions and guard clauses
- Implement custom error types for consistent error handling
- Never expose sensitive data in client code or logs
- Validate all API inputs and implement proper CORS policies
- Handle sensitive data (calendar tokens) with encryption

#### Development Methodology
- **System 2 Thinking**: Approach problems with analytical rigor, break down requirements into manageable parts
- **Tree of Thoughts**: Evaluate multiple solutions and their consequences before implementation
- **Iterative Refinement**: Consider improvements, edge cases, and optimizations before finalizing code

#### Performance Optimization
- **Next.js Optimization**: Use Server Components for data fetching, implement proper caching strategies, optimize images with Next.js Image component
- **Database Optimization**: Use proper indexing for Supabase queries, implement pagination for event listings, cache frequently accessed data
- **Mobile Performance**: Minimize JavaScript bundle size, use progressive loading, optimize for slow networks

#### Business Logic Patterns
- **Event Management**: Support both free RSVP and paid ticketing, implement capacity management, handle event status (upcoming, in-progress, past, full)
- **User Flows**: Guest checkout must work seamlessly, account creation should be optional but encouraged, calendar integration should work for both guests and registered users
- **Mobile-First**: Design for mobile viewport first (320px+), use touch-friendly interactive elements, implement swipe gestures where appropriate

### Environment Configuration
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY` for transactional emails

### Deployment
- **Platform**: Vercel with auto-deployment on main branch
- **Live URL**: https://local-loop-qa.vercel.app
- **CI/CD**: 6 active GitHub workflows including performance testing and monitoring
- **Database backups**: Automated daily backups configured