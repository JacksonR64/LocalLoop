# 🧪 E2E Testing Guide

## Overview

This guide covers the comprehensive end-to-end testing setup for LocalLoop using Playwright. The E2E test suite ensures critical user journeys work correctly across browsers and devices.

## 📁 Test Suite Structure

```
e2e/
├── README.md                           # Complete E2E documentation
├── config/
│   └── test-credentials.ts            # Centralized test account configuration
├── utils/
│   └── auth-helpers.ts                # Robust authentication utilities
├── authentication-flow.spec.ts        # Login, logout, session management
├── ticket-purchase-flow.spec.ts       # Event discovery and purchase flows
├── refund-production.spec.ts          # Refund system testing
├── critical-user-journeys.spec.ts     # High-priority business flows
└── simple-dashboard-test.spec.ts      # Quick verification tests
```

## 🎯 Test Categories

### **Core Business Flows**
- **Authentication** - Login, logout, session persistence, role-based access
- **Ticket Purchase** - Event discovery, ticket selection, Stripe checkout
- **Refund System** - Refund requests, validation, processing
- **Critical Journeys** - Complete end-to-end user scenarios

### **Supporting Tests**
- **Dashboard Verification** - API testing and UI validation
- **Cross-Browser** - Chrome, Firefox, Safari compatibility
- **Mobile Testing** - Responsive design and touch interactions

## 🚀 Quick Start

### Run Test Suites

```bash
# Individual test categories
npm run test:e2e:auth          # Authentication flows
npm run test:e2e:purchase      # Ticket purchase flows
npm run test:e2e:refund        # Refund functionality
npm run test:e2e:critical      # Critical user journeys
npm run test:e2e:dashboard     # Quick dashboard verification

# Test suite combinations
npm run test:e2e:suite         # Core production tests (auth + purchase + refund)
npm run test:e2e               # All E2E tests

# Browser-specific testing
npm run test:cross-browser     # Desktop: Chrome, Firefox, Safari
npm run test:mobile            # Mobile: Chrome, Safari

# Debug modes
npm run test:e2e:headed        # Run with visible browser
npx playwright test --debug    # Step-through debugging
```

### CI/CD Integration

```bash
# Fast smoke tests (5-10 minutes) - perfect for CI gates
npm run test:e2e:critical

# Core functionality (15-20 minutes) - for deployment verification
npm run test:e2e:suite

# Full regression testing (30-45 minutes) - for releases
npm run test:e2e
```

## 🔧 Configuration

### Test Credentials

Test accounts are configured in `e2e/config/test-credentials.ts`:

```typescript
export const TEST_ACCOUNTS = {
  user: {
    email: 'test1@localloopevents.xyz',
    password: 'zunTom-9wizri-refdes',
    role: 'user'
  },
  staff: {
    email: 'teststaff1@localloopevents.xyz', 
    password: 'bobvip-koDvud-wupva0',
    role: 'staff'
  },
  admin: {
    email: 'testadmin1@localloopevents.xyz',
    password: 'nonhyx-1nopta-mYhnum',
    role: 'admin'
  }
};

export const GOOGLE_TEST_ACCOUNT = {
  email: 'TestLocalLoop@gmail.com',
  password: 'zowvok-8zurBu-xovgaj'
};
```

### Authentication Helpers

The `e2e/utils/auth-helpers.ts` provides robust authentication utilities:

```typescript
import { createAuthHelpers } from './utils/auth-helpers';

const auth = createAuthHelpers(page);

// Login methods
await auth.loginAsUser();      // Standard user login
await auth.loginAsStaff();     // Staff user login  
await auth.loginAsAdmin();     // Admin user login
await auth.loginWithGoogle();  // Google OAuth login
await auth.proceedAsGuest();   // Guest mode (no auth)

// Authentication state management
const isAuth = await auth.isAuthenticated();
await auth.verifyAuthenticated();
const userName = await auth.getCurrentUserName();

// Session management
await auth.waitForAuthState(8000);  // Wait for auth to resolve
await auth.logout();                 // Complete logout flow
```

## 📋 Test Patterns & Best Practices

### Data-TestId Selectors

All tests use robust `data-testid` selectors for reliable element targeting:

```typescript
// ✅ Reliable - uses data-testid
await page.locator('[data-testid="login-submit-button"]').click();
await page.locator('[data-testid="refund-continue-button"]').click();
await page.locator('[data-testid="profile-dropdown-button"]').click();

// ❌ Fragile - uses text/CSS that can change
await page.locator('button:has-text("Sign In")').click();
await page.locator('.submit-btn').click();
```

### Mobile-Responsive Testing

Tests include mobile viewport testing:

```typescript
// Set mobile viewport
await page.setViewportSize({ width: 375, height: 667 });

// Use mobile-specific selectors
const mobileButton = page.locator('[data-testid="mobile-profile-dropdown-button"]');

// Verify touch-friendly button sizes
const buttonSize = await button.boundingBox();
expect(buttonSize?.height).toBeGreaterThanOrEqual(44); // iOS guidelines
```

### Error Scenario Testing

Comprehensive error handling validation:

```typescript
// Test API validation
const response = await page.evaluate(async () => {
  const res = await fetch('/api/refunds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ /* invalid data */ })
  });
  return { status: res.status, body: await res.json() };
});

expect(response.status).toBe(400);
expect(response.body.error).toContain('Invalid request data');
```

## 🎯 Test Coverage

### Authentication Flow (`authentication-flow.spec.ts`)
- ✅ Email/password login and logout
- ✅ Role-based access (user, staff, admin)
- ✅ Session persistence across page refreshes
- ✅ Mobile authentication flows
- ✅ Cross-tab session management
- ✅ Google OAuth integration
- ✅ Authentication error handling
- ✅ Password field security features
- ✅ Form validation

### Ticket Purchase Flow (`ticket-purchase-flow.spec.ts`)
- ✅ Free event RSVP flows (authenticated + guest)
- ✅ Paid event ticket selection and checkout
- ✅ Guest checkout with customer information
- ✅ Stripe integration and payment redirection
- ✅ Order confirmation and dashboard verification
- ✅ Mobile purchase flows with touch optimization
- ✅ Purchase flow error handling
- ✅ Event discovery and navigation

### Refund System (`refund-production.spec.ts`)
- ✅ Refund dialog display and form interaction
- ✅ Form validation and business logic
- ✅ API authentication and authorization
- ✅ Refund deadline validation (24-hour rule)
- ✅ Complete refund workflow
- ✅ Mobile refund flows
- ✅ Success and error state handling
- ✅ Refund reason validation

### Critical User Journeys (`critical-user-journeys.spec.ts`)
- ✅ Complete authenticated user journey (login → browse → RSVP → dashboard)
- ✅ Guest checkout flow (browse → select → payment intent)
- ✅ Order management flow (dashboard → order → refund request)
- ✅ Cross-device session management
- ✅ API resilience testing
- ✅ Performance monitoring and thresholds

## 🔍 Debugging & Troubleshooting

### Test Results & Artifacts

Failed tests automatically capture:
- **Screenshots**: `test-results/test-name/screenshot.png`
- **Videos**: `test-results/test-name/video.webm`
- **Error Context**: `test-results/test-name/error-context.md`

### Debug Modes

```bash
# Run with Playwright Inspector for step-through debugging
npx playwright test --debug

# Run specific test with debugging
npx playwright test e2e/authentication-flow.spec.ts --debug

# Run with headed browser to see interactions
npm run test:e2e:headed

# Generate and view test report
npx playwright show-report
```

### Console Logging

Tests include detailed console logging for troubleshooting:

```
🔑 Starting authentication...
✅ Step 1: User authentication successful
✅ Step 2: Event browsing working - 5 events found
✅ Step 3: Event details page accessible
✅ Step 4: RSVP completed successfully
✅ Step 5: Dashboard loaded with 3 total items (orders + RSVPs)
```

### Common Issues & Solutions

**Authentication Timeouts**
```typescript
// Increase timeout for auth operations
test.setTimeout(60000);

// Wait for auth state to resolve
await auth.waitForAuthState(10000);
```

**Element Not Found**
```typescript
// Use robust selectors with fallbacks
const button = page.locator('[data-testid="submit-button"], button:has-text("Submit")');
await expect(button).toBeVisible({ timeout: 10000 });
```

**Mobile Navigation Issues**
```typescript
// Check viewport size and use appropriate selectors
const isMobile = await page.viewportSize()?.width < 768;
const selector = isMobile 
  ? '[data-testid="mobile-profile-button"]' 
  : '[data-testid="desktop-profile-button"]';
```

## 🚀 CI/CD Integration

### Production Health Checks

Use as health checks for production monitoring:

```bash
# Quick health check (2-5 minutes)
npm run test:e2e:dashboard

# Critical business flow check (5-10 minutes)  
npm run test:e2e:critical
```

### CI Pipeline Integration

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    npm ci
    npx playwright install
    npm run test:e2e:suite

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

### Test Categories by Environment

**🔥 Critical (CI Gates)**
- Authentication flows
- Purchase completion
- Order dashboard access
- Refund request submission

**⚡ Important (Nightly)**
- Cross-browser compatibility
- Mobile responsive flows
- Error handling scenarios
- Performance thresholds

**📊 Extended (Weekly)**
- Load testing scenarios
- Accessibility compliance
- Admin functionality
- Edge case scenarios

## 🛠️ Maintenance & Extension

### Adding New Tests

1. **Follow naming conventions**: `feature-flow.spec.ts`
2. **Use auth helpers**: Don't implement authentication from scratch
3. **Add data-testids**: Coordinate with developers for reliable selectors
4. **Test error scenarios**: Include validation and edge cases
5. **Include mobile testing**: Test responsive design
6. **Document thoroughly**: Update this guide and test README

### Test Data Management

- **Test Accounts**: Use accounts in `config/test-credentials.ts`
- **Test Events**: Ensure test events exist in database (`TEST_EVENT_IDS`)
- **Clean State**: Tests should be independent and not rely on specific data
- **Database Isolation**: Tests use separate test accounts to avoid conflicts

### Performance Considerations

- **Timeouts**: Set appropriate timeouts (60-120s for complex flows)
- **Wait Strategies**: Use `waitForLoadState('networkidle')` sparingly
- **Parallel Execution**: Tests run in parallel for faster CI feedback
- **Resource Management**: Use screenshots only for debugging/failures

## 📊 Success Metrics

The E2E test suite ensures:

- ✅ **Critical user flows work across all browsers**
- ✅ **Authentication system is robust and secure**  
- ✅ **Purchase and refund flows complete successfully**
- ✅ **Mobile experience is fully functional**
- ✅ **API integrations handle errors gracefully**
- ✅ **Performance meets acceptable thresholds**

### Coverage Goals

- **Authentication**: 100% coverage of login/logout flows
- **Purchase Flow**: 100% coverage of ticket selection and checkout
- **Refund System**: 100% coverage of refund request and validation
- **Mobile Testing**: All flows tested on mobile viewports
- **Error Handling**: All API error scenarios tested

## 🔗 Related Documentation

- **[Testing Guide](testing-guide.md)** - Overall testing strategy
- **[CI/CD Workflows](ci-cd-workflows.md)** - Integration with deployment pipeline
- **[Troubleshooting Guide](../operations/troubleshooting-guide.md)** - Production issue resolution
- **[Refund System Guide](refund-system-guide.md)** - Complete refund documentation

---

*This E2E testing infrastructure provides comprehensive coverage of LocalLoop's critical business flows and ensures reliable operation across browsers and devices.*