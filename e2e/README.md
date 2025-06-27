# LocalLoop E2E Test Suite

This directory contains comprehensive end-to-end tests for the LocalLoop event platform. These tests use Playwright with robust authentication helpers and data-testid selectors for reliable cross-browser testing.

## 🎯 Test Categories

### Core Business Flows
- **`authentication-flow.spec.ts`** - Login, logout, session management, role-based access
- **`ticket-purchase-flow.spec.ts`** - Event discovery, ticket selection, checkout, order confirmation  
- **`refund-production.spec.ts`** - Refund requests, validation, processing, confirmations
- **`critical-user-journeys.spec.ts`** - High-priority end-to-end user scenarios

### Supporting Tests
- **`simple-dashboard-test.spec.ts`** - Quick dashboard verification and API testing
- **`purchase-to-dashboard-flow.spec.ts`** - Complete purchase-to-dashboard verification

## 🚀 Quick Start

### Run Individual Test Suites
```bash
# Authentication flows
npm run test:e2e:auth

# Ticket purchase flows  
npm run test:e2e:purchase

# Refund functionality
npm run test:e2e:refund

# Critical user journeys
npm run test:e2e:critical

# Dashboard verification
npm run test:e2e:dashboard
```

### Run Core Test Suite
```bash
# Run the main production test suite
npm run test:e2e:suite

# Run all E2E tests
npm run test:e2e

# Run with browser UI for debugging
npm run test:e2e:headed
```

### Cross-Browser Testing
```bash
# Desktop browsers (Chrome, Firefox, Safari)
npm run test:cross-browser

# Mobile browsers (Chrome, Safari)
npm run test:mobile
```

## 🔧 Configuration

### Test Credentials
Test accounts are configured in `config/test-credentials.ts`:

- **User**: `test1@localloopevents.xyz` / `zunTom-9wizri-refdes`
- **Staff**: `teststaff1@localloopevents.xyz` / `bobvip-koDvud-wupva0`
- **Admin**: `testadmin1@localloopevents.xyz` / `nonhyx-1nopta-mYhnum`
- **Google OAuth**: `TestLocalLoop@gmail.com` / `zowvok-8zurBu-xovgaj`

### Auth Helpers
The `utils/auth-helpers.ts` provides robust authentication utilities:

```typescript
import { createAuthHelpers } from './utils/auth-helpers';

const auth = createAuthHelpers(page);

// Login as different user types
await auth.loginAsUser();
await auth.loginAsStaff(); 
await auth.loginAsAdmin();
await auth.loginWithGoogle();

// Guest mode
await auth.proceedAsGuest();

// Authentication state
const isAuth = await auth.isAuthenticated();
await auth.verifyAuthenticated();

// Logout
await auth.logout();
```

## 📋 Test Patterns

### Data-TestId Selectors
All tests use robust `data-testid` selectors for reliable element targeting:

```typescript
// ✅ Reliable - uses data-testid
await page.locator('[data-testid="login-submit-button"]').click();

// ❌ Fragile - uses text/CSS that can change
await page.locator('button:has-text("Sign In")').click();
```

### Mobile-First Testing
Tests include mobile viewport testing:

```typescript
// Set mobile viewport
await page.setViewportSize({ width: 375, height: 667 });

// Use mobile-specific selectors
const mobileButton = page.locator('[data-testid="mobile-profile-dropdown-button"]');
```

### Error Handling
Tests include comprehensive error scenarios:

```typescript
// Test API validation
const response = await page.evaluate(async () => {
  const res = await fetch('/api/refunds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* invalid data */ })
  });
  return { status: res.status, body: await res.json() };
});

expect(response.status).toBe(400);
```

## 🎯 Test Coverage

### Authentication (authentication-flow.spec.ts)
- ✅ Email/password login and logout
- ✅ Role-based access (user, staff, admin)
- ✅ Session persistence across refreshes
- ✅ Mobile authentication flows
- ✅ Cross-tab session management
- ✅ Google OAuth integration
- ✅ Error handling and validation

### Ticket Purchase (ticket-purchase-flow.spec.ts)
- ✅ Free event RSVP flows (authenticated + guest)
- ✅ Paid event ticket selection and checkout
- ✅ Guest checkout with customer information
- ✅ Stripe integration and payment flow
- ✅ Order confirmation and dashboard verification
- ✅ Mobile purchase flows
- ✅ Error handling and validation

### Refund System (refund-production.spec.ts)
- ✅ Refund dialog display and form interaction
- ✅ Form validation and business logic
- ✅ API authentication and authorization
- ✅ Refund deadline validation
- ✅ Complete refund workflow
- ✅ Mobile refund flows
- ✅ Success and error states

### Critical Journeys (critical-user-journeys.spec.ts)
- ✅ Complete authenticated user journey
- ✅ Guest checkout flow
- ✅ Order management and refund flow
- ✅ Cross-device session management
- ✅ API resilience testing
- ✅ Performance and loading states

## 🔍 Debugging

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots: `test-results/test-name/screenshot.png`
- Videos: `test-results/test-name/video.webm`
- Error context: `test-results/test-name/error-context.md`

### Debug Mode
```bash
# Run with Playwright Inspector
npx playwright test --debug

# Run specific test with debugging
npx playwright test e2e/authentication-flow.spec.ts --debug

# Run with headed browser
npm run test:e2e:headed
```

### Console Logging
Tests include detailed console logging:
```
🔑 Starting authentication...
✅ Step 1: User authentication successful
✅ Step 2: Event browsing working - 5 events found
✅ Step 3: Event details page accessible
```

## 🚀 CI/CD Integration

### Production Test Suite
```bash
# Core production tests (fastest)
npm run test:e2e:suite

# Critical user journeys only
npm run test:e2e:critical

# Full test suite
npm run test:e2e
```

### Test Categories by Priority

**🔥 Critical (CI gates)**
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
- Social features
- Admin functionality

## 📈 Monitoring and Alerting

### Health Check Tests
Use critical journey tests as production health checks:

```bash
# Quick health check (5 minutes)
npm run test:e2e:critical

# API health check (2 minutes)  
npm run test:e2e:dashboard
```

### Metrics to Track
- Test pass/fail rates
- Test execution time trends
- Screenshot analysis for UI regressions
- API response time monitoring

## 🛠️ Maintenance

### Adding New Tests
1. Create test file in appropriate category
2. Use auth helpers: `createAuthHelpers(page)`
3. Use data-testid selectors for reliability
4. Include mobile viewport testing
5. Add comprehensive error scenarios
6. Update package.json scripts if needed

### Test Data Management
- Use test accounts in `config/test-credentials.ts`
- Ensure test events exist in database
- Clean up test data between runs
- Use database snapshots for consistent state

### Performance Considerations
- Set appropriate timeouts (60-120s for complex flows)
- Use `waitForLoadState('networkidle')` sparingly
- Batch API calls where possible
- Use screenshots only for debugging/failures

## 📝 Contributing

When adding new E2E tests:

1. **Follow naming conventions**: `feature-flow.spec.ts`
2. **Use auth helpers**: Don't implement auth from scratch
3. **Add data-testids**: Work with developers to add reliable selectors
4. **Test error scenarios**: Not just happy paths
5. **Include mobile**: Test responsive design
6. **Document thoroughly**: Update this README

## 🎉 Success Metrics

These E2E tests ensure:
- ✅ Critical user flows work across browsers
- ✅ Authentication system is robust and secure
- ✅ Purchase and refund flows complete successfully
- ✅ Mobile experience is fully functional
- ✅ API integrations are reliable
- ✅ Error handling provides good user experience

The test suite provides confidence for production deployments and catches regressions before they reach users.