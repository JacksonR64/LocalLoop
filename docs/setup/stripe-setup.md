# Stripe Integration Setup Guide

## Overview
This guide covers the complete setup of Stripe integration for LocalLoop's ticketing and payment system.

## 1. Stripe Account Setup

### Development Environment
For development, we use Stripe test mode which allows unlimited testing without real money transactions.

1. **Create Stripe Account** (if not already done):
   - Visit [stripe.com](https://stripe.com)
   - Sign up with business email
   - Complete account verification

2. **Navigate to Developer Dashboard**:
   - Go to Stripe Dashboard → Developers → API Keys
   - Toggle to "Test mode" (top right)

### Production Environment
For production deployment:

1. **Complete Business Verification**:
   - Provide business details
   - Connect bank account for payouts
   - Complete identity verification

2. **Switch to Live Mode**:
   - Toggle to "Live mode" in Dashboard
   - Generate live API keys

## 2. API Key Configuration

### Required Keys

#### Test Mode (Development)
```bash
# Public key (can be exposed in frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Secret key (server-side only, never expose)
STRIPE_SECRET_KEY=sk_test_51...

# Webhook signing secret (for webhook verification)
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Live Mode (Production)
```bash
# Public key (can be exposed in frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...

# Secret key (server-side only, never expose)
STRIPE_SECRET_KEY=sk_live_51...

# Webhook signing secret (for webhook verification)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Environment Variable Setup

1. **Local Development** (`.env.local`):
   ```bash
   # Stripe Test Configuration
   STRIPE_SECRET_KEY=sk_test_your_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

2. **Production Deployment** (Vercel/hosting platform):
   - Set environment variables in hosting platform dashboard
   - Use live mode keys for production

## 3. Webhook Configuration

### Development Webhooks
For local development, use Stripe CLI:

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Other platforms: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward Events to Local Server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Production Webhooks
Set up webhooks in Stripe Dashboard:

1. **Go to Developers → Webhooks**
2. **Create Endpoint**:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: Select relevant events (see Events section below)

### Required Webhook Events
```
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
checkout.session.completed
checkout.session.expired
invoice.payment_succeeded
invoice.payment_failed
```

## 4. Test Cards

Stripe provides test card numbers for different scenarios:

```
# Successful payments
4242424242424242  # Visa
4000000000000002  # Visa (declined)
4000000000009995  # Visa (insufficient funds)

# 3D Secure authentication
4000000000003220  # Visa (requires authentication)

# International cards
4000000760000002  # Brazil
4000003800000446  # Mexico
```

## 5. Security Best Practices

### API Key Security
- **Never expose secret keys** in frontend code
- **Use environment variables** for all sensitive data
- **Implement key rotation** procedures
- **Monitor API key usage** in Stripe Dashboard

### Webhook Security
- **Verify webhook signatures** using `STRIPE_WEBHOOK_SECRET`
- **Use HTTPS** for all webhook endpoints
- **Implement idempotency** for webhook handling
- **Log webhook events** for debugging

### Payment Security
- **Use Stripe Elements** for secure card collection
- **Implement SCA compliance** (Strong Customer Authentication)
- **Store minimal payment data** (use Stripe Customer objects)
- **Validate amounts** on server-side

## 6. Testing Strategy

### Test Scenarios
1. **Successful Payments**:
   - Single ticket purchase
   - Multiple ticket types
   - Guest checkout
   - Registered user checkout

2. **Failed Payments**:
   - Declined cards
   - Insufficient funds
   - Authentication failures
   - Network errors

3. **Webhook Testing**:
   - Payment success events
   - Payment failure events
   - Timeout scenarios
   - Duplicate events

### Load Testing
- Test with multiple concurrent purchases
- Verify capacity enforcement
- Check webhook handling under load

## 7. Production Deployment Checklist

### Pre-Deployment
- [ ] Business verification complete
- [ ] Bank account connected
- [ ] Live API keys generated
- [ ] Webhook endpoints configured
- [ ] SSL certificate installed

### Environment Configuration
- [ ] Live API keys set in production environment
- [ ] Webhook secrets configured
- [ ] Domain verification complete
- [ ] Test purchases in live mode

### Monitoring
- [ ] Stripe Dashboard monitoring setup
- [ ] Error logging implemented
- [ ] Payment failure alerts configured
- [ ] Webhook delivery monitoring active

## 8. Integration Architecture

### Frontend Components
- **Stripe Elements**: Secure card input collection
- **Payment confirmation**: Success/failure handling
- **Guest checkout**: Streamlined payment flow

### Backend Endpoints
- `/api/create-payment-intent`: Initialize payments
- `/api/webhooks/stripe`: Handle Stripe events
- `/api/tickets/purchase`: Ticket creation logic

### Database Integration
- **Orders table**: Store payment records
- **Tickets table**: Generated tickets after payment
- **Payment status tracking**: Real-time updates

## 9. Support and Resources

### Documentation
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Integration Guide](https://stripe.com/docs/stripe-js/react)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

### Support Channels
- Stripe Support (via Dashboard)
- Developer Community Forums
- GitHub Issues and Discussions

---

## Quick Start Commands

```bash
# Install Stripe dependencies
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Start local development with webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test payment flow
npm run dev
```

This setup provides a complete foundation for secure, scalable payment processing with Stripe integration. 