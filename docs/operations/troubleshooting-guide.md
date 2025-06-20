# 🔧 LocalLoop Troubleshooting Guide

## 📋 Overview

This guide provides systematic troubleshooting procedures for common LocalLoop issues. It includes decision trees, step-by-step diagnostics, and resolution procedures for production environments.

**Target Audience**: Technical support, DevOps engineers, and system administrators
**Scope**: Production troubleshooting for LocalLoop application on Vercel with Supabase backend

---

## 🚨 Emergency Quick Reference

### **Immediate Response Checklist**
```
□ Document the issue with screenshots/error messages
□ Check system status dashboard
□ Verify if issue affects all users or specific users/features
□ Check recent deployments or configuration changes
□ Review error logs for error patterns
□ Follow appropriate severity response procedure
```

### **Critical System Endpoints**
```bash
# Application health check
curl -f https://localloop.com/api/health

# Database connectivity
curl -f https://localloop.com/api/health/database

# Payment system status
curl -f https://localloop.com/api/health/payments

# Email service status  
curl -f https://localloop.com/api/health/email
```

---

## 🔍 Issue Classification & Decision Tree

### **Step 1: Issue Severity Assessment**

```
Is the entire application down?
├── YES → [CRITICAL] Complete Outage
│   └── Go to: Section A - Complete Application Outage
│
├── NO → Are core features (registration, payments) affected?
    ├── YES → [HIGH] Core Feature Failure
    │   └── Go to: Section B - Core Feature Issues
    │
    └── NO → Are users experiencing errors or performance issues?
        ├── YES → [MEDIUM] User Experience Issues
        │   └── Go to: Section C - User Experience Problems
        │
        └── NO → [LOW] Minor Issues
            └── Go to: Section D - Minor Issues & Optimizations
```

### **Step 2: User Impact Assessment**

```
How many users are affected?
├── All users → Critical Priority
├── Multiple users → High Priority  
├── Single user → Medium Priority
└── No user impact → Low Priority
```

---

## 🚨 Section A: Complete Application Outage

### **A1. Application Not Loading (HTTP 5xx/4xx)**

#### **Quick Diagnostics**
```bash
# 1. Test application response
curl -I https://localloop.com
# Expected: HTTP/2 200 OK

# 2. Check DNS resolution
nslookup localloop.com
# Expected: Resolves to Vercel IP addresses

# 3. Test from different locations
curl -I https://localloop.com --connect-timeout 10
```

#### **Step-by-Step Resolution**

**Step 1: Verify Vercel Platform Status**
```bash
# Check Vercel status page
# https://vercel-status.com

# Access Vercel dashboard
# https://vercel.com/dashboard
# Look for deployment failures or service issues
```

**Step 2: Check Recent Deployments**
```bash
# In Vercel Dashboard → LocalLoop → Deployments
# Look for:
# - Failed deployments (red status)
# - Recent changes that might have caused issues
# - Build errors or timeout issues

# If bad deployment found:
# 1. Click on deployment
# 2. Select "Actions" → "Redeploy"
# 3. Monitor new deployment
```

**Step 3: Review Function Logs**
```bash
# In Vercel Dashboard → Functions
# Click on failing function → View Logs
# Look for:
# - Runtime errors
# - Memory/timeout issues
# - Database connection failures
# - Import/module errors
```

**Step 4: Database Connectivity Test**
```bash
# Test database from external service
curl -f "https://localloop.com/api/health/database"

# If database issue suspected:
# Access Supabase Dashboard → Project → Logs
# Check for connection limit exceeded
# Review recent database changes
```

**Step 5: Emergency Rollback (if needed)**
```bash
# In Vercel Dashboard → Deployments
# Find last known good deployment
# Click "Actions" → "Promote to Production"
# Monitor rollback completion
```

### **A2. Build/Deployment Failures**

#### **Common Build Issues**

**TypeScript Compilation Errors**
```bash
# Check build logs in Vercel Dashboard
# Look for:
# - Type errors
# - Missing dependencies
# - Import path issues

# Quick fix process:
git checkout main
npm run build

# If build fails locally:
# 1. Fix TypeScript errors
# 2. Test locally: npm run dev
# 3. Commit and push fixes
```

**Dependency Installation Failures**
```bash
# Check for:
# - package.json syntax errors
# - Version conflicts
# - Registry connectivity issues

# Resolution:
# 1. Delete package-lock.json
# 2. Run: npm install
# 3. Test: npm run build
# 4. Commit changes
```

**Environment Variable Issues**
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Verify all required variables are set:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - STRIPE_SECRET_KEY
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - RESEND_API_KEY
```

---

## ⚠️ Section B: Core Feature Issues

### **B1. User Authentication Problems**

#### **Users Cannot Log In**

**Quick Diagnostics**
```bash
# Test auth endpoint
curl -X POST https://localloop.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Check Supabase auth status
# Access: Supabase Dashboard → Authentication → Users
```

**Step-by-Step Resolution**

**Step 1: Verify Supabase Auth Configuration**
```bash
# In Supabase Dashboard → Authentication → Settings
# Check:
# - Site URL matches production URL
# - Email auth is enabled
# - Password requirements are reasonable
# - Rate limiting isn't too restrictive
```

**Step 2: Test OAuth Providers (Google)**
```bash
# Check Google OAuth configuration
# In Google Cloud Console → APIs & Credentials
# Verify:
# - OAuth consent screen is published
# - Redirect URIs include production URL
# - Client ID/secret are correctly set in Vercel

# Test OAuth flow manually
# Access: https://localloop.com/auth/login
# Click "Sign in with Google"
# Monitor network tab for errors
```

**Step 3: Check Database Auth Tables**
```sql
-- In Supabase SQL Editor
-- Check recent auth attempts
SELECT 
    email,
    created_at,
    email_confirmed_at,
    banned_until
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Check for auth errors
SELECT *
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND event_type IN ('auth_error', 'login_failed')
ORDER BY created_at DESC;
```

**Step 4: Reset User Session (if specific user affected)**
```sql
-- Clear user sessions
DELETE FROM auth.sessions 
WHERE user_id = '[USER_ID]';

-- Reset email confirmation if needed
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

#### **Session Persistence Issues**

**Quick Diagnostics**
```bash
# Check cookie settings in browser dev tools
# Verify:
# - Auth cookies are being set
# - Cookie domain is correct
# - Secure flags are appropriate for environment

# Test session endpoint
curl -H "Authorization: Bearer [TOKEN]" \
  https://localloop.com/api/auth/session
```

**Resolution Steps**
```bash
# 1. Check middleware configuration
# Review: middleware.ts
# Ensure proper cookie handling for auth

# 2. Verify environment variables
# NEXT_PUBLIC_SUPABASE_URL must be correct
# NEXT_PUBLIC_SUPABASE_ANON_KEY must be valid

# 3. Test in incognito mode
# Rules out browser cache issues

# 4. Check CORS configuration
# In Supabase → API → CORS
# Ensure production domain is allowed
```

### **B2. Payment Processing Failures**

#### **Stripe Integration Issues**

**Quick Diagnostics**
```bash
# Test Stripe connection
curl -f https://localloop.com/api/health/payments

# Check Stripe Dashboard
# Access: https://dashboard.stripe.com
# Look for recent failed payments or webhooks
```

**Step-by-Step Resolution**

**Step 1: Verify Stripe Configuration**
```bash
# In Vercel Environment Variables:
# - STRIPE_SECRET_KEY (must start with sk_live_ for production)
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (must start with pk_live_)
# - STRIPE_WEBHOOK_SECRET

# In Stripe Dashboard → Developers → API Keys:
# Verify keys match environment variables
```

**Step 2: Check Webhook Configuration**
```bash
# In Stripe Dashboard → Developers → Webhooks
# Verify webhook endpoint: https://localloop.com/api/webhooks/stripe
# Events to listen for:
# - payment_intent.succeeded
# - payment_intent.payment_failed
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted

# Test webhook endpoint
curl -X POST https://localloop.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

**Step 3: Test Payment Flow**
```bash
# Manual testing in production (use small amount):
# 1. Create test event
# 2. Attempt ticket purchase with test card: 4242 4242 4242 4242
# 3. Monitor Stripe Dashboard for payment creation
# 4. Verify webhook delivery
# 5. Check database for order creation
```

**Step 4: Debug Failed Payments**
```sql
-- Check recent payment attempts
SELECT 
    o.id,
    o.user_id,
    o.status,
    o.stripe_payment_intent_id,
    o.total_amount,
    o.created_at,
    u.email
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > NOW() - INTERVAL '24 hours'
AND o.status IN ('pending', 'failed')
ORDER BY o.created_at DESC;
```

### **B3. Database Connection Issues**

#### **Connection Pool Exhaustion**

**Quick Diagnostics**
```bash
# Check database connectivity
curl -f https://localloop.com/api/health/database

# In Supabase Dashboard → Settings → Database
# Check current connections vs. limits
```

**Resolution Steps**
```sql
-- Check active connections
SELECT 
    COUNT(*) as active_connections,
    usename,
    application_name
FROM pg_stat_activity 
WHERE state = 'active'
GROUP BY usename, application_name;

-- Check for long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '1 minute'
ORDER BY duration DESC;

-- Kill long-running queries if needed (CAUTION)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '10 minutes'
AND state = 'active';
```

**Connection Pool Configuration**
```javascript
// Check Supabase client configuration
// Verify connection pooling settings in application
// Consider implementing connection pooling middleware
```

---

## 🐛 Section C: User Experience Problems

### **C1. Performance Issues**

#### **Slow Page Load Times**

**Quick Diagnostics**
```bash
# Test page load times
curl -w "@curl-format.txt" -o /dev/null -s https://localloop.com

# curl-format.txt content:
#     time_namelookup:  %{time_namelookup}\n
#     time_connect:     %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#     time_pretransfer: %{time_pretransfer}\n
#     time_redirect:    %{time_redirect}\n
#     time_starttransfer: %{time_starttransfer}\n
#     time_total:       %{time_total}\n

# Check Core Web Vitals
# Access: Vercel Dashboard → Analytics → Web Vitals
```

**Step-by-Step Resolution**

**Step 1: Identify Performance Bottlenecks**
```bash
# Check Vercel Analytics
# Look for:
# - Slow function execution times
# - High memory usage
# - Timeout errors

# Review database performance
# In Supabase Dashboard → Reports
# Check for:
# - Slow queries
# - High CPU usage
# - Index usage
```

**Step 2: Database Query Optimization**
```sql
-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('events', 'orders', 'rsvps', 'users')
ORDER BY tablename, attname;
```

**Step 3: Frontend Optimization**
```bash
# Check bundle size
# In Vercel Dashboard → Functions
# Look for large function bundles

# Review image optimization
# Ensure all images use Next.js Image component
# Check WebP format usage

# Verify caching headers
curl -I https://localloop.com/api/events
# Look for appropriate Cache-Control headers
```

#### **High Memory Usage**

**Diagnostics**
```bash
# Check function memory usage in Vercel Dashboard
# Look for functions exceeding memory limits

# Review memory allocation in serverless functions
# Check for:
# - Memory leaks in API routes
# - Large object allocations
# - Inefficient data processing
```

**Resolution**
```javascript
// Optimize data fetching
// Use pagination for large datasets
// Implement proper connection cleanup
// Use streaming for large responses

// Example optimization:
const events = await supabase
  .from('events')
  .select('id, title, date, location')  // Only needed fields
  .range(0, 49)  // Pagination
  .order('date', { ascending: true });
```

### **C2. Email Delivery Issues**

#### **Emails Not Being Sent**

**Quick Diagnostics**
```bash
# Test email endpoint
curl -X POST https://localloop.com/api/health/email

# Check Resend Dashboard
# Access: https://resend.com/dashboard
# Review recent email activity
```

**Step-by-Step Resolution**

**Step 1: Verify Resend Configuration**
```bash
# Check environment variables:
# - RESEND_API_KEY (must be valid)
# - RESEND_FROM_EMAIL (must be verified domain)

# In Resend Dashboard → Settings → API Keys
# Verify API key is active and has correct permissions
```

**Step 2: Check Email Templates**
```bash
# Test email template rendering
# Access: LocalLoop Admin → Email Templates
# Send test emails to verify templates work

# Check for template syntax errors
# Review recent email logs for rendering failures
```

**Step 3: Domain Configuration**
```bash
# In Resend Dashboard → Domains
# Verify domain DNS settings:
# - SPF record: "v=spf1 include:_spf.resend.com ~all"
# - DKIM records are correctly configured
# - DMARC policy is set

# Test DNS configuration
dig TXT _dmarc.yourdomain.com
dig TXT resend._domainkey.yourdomain.com
```

**Step 4: Check Delivery Status**
```sql
-- Check email delivery logs (if stored in database)
SELECT 
    recipient_email,
    subject,
    status,
    error_message,
    created_at
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
AND status != 'delivered'
ORDER BY created_at DESC;
```

#### **Emails Going to Spam**

**Diagnostics & Resolution**
```bash
# Check email reputation
# Use tools like:
# - MXToolbox: https://mxtoolbox.com/
# - Mail-tester: https://www.mail-tester.com/

# Verify domain authentication
# Ensure SPF, DKIM, and DMARC are properly configured

# Review email content
# Check for spam triggers:
# - Excessive capitalization
# - Suspicious links
# - Poor text-to-image ratio
```

---

## 🔧 Section D: Minor Issues & Optimizations

### **D1. Google Calendar Integration Issues**

#### **Calendar Events Not Syncing**

**Quick Diagnostics**
```bash
# Test calendar integration
curl -H "Authorization: Bearer [USER_TOKEN]" \
  https://localloop.com/api/calendar/sync

# Check Google Cloud Console
# Access: https://console.cloud.google.com
# Verify Calendar API quota usage
```

**Resolution Steps**
```bash
# 1. Verify Google OAuth Configuration
# In Google Cloud Console → APIs & Credentials
# Check:
# - Calendar API is enabled
# - OAuth consent screen is configured
# - Redirect URIs are correct

# 2. Check token expiration
# Review stored Google tokens in database
# Implement token refresh mechanism

# 3. Test API quotas
# Monitor API usage in Google Cloud Console
# Increase quotas if needed
```

### **D2. UI/UX Issues**

#### **Responsive Design Problems**

**Diagnostics**
```bash
# Test responsive design
# Use browser dev tools to test different screen sizes
# Check for:
# - Horizontal scrolling on mobile
# - Overlapping elements
# - Unreadable text sizes

# Verify CSS framework integrity
# Check for missing Tailwind classes
# Review custom CSS conflicts
```

**Resolution**
```css
/* Common responsive fixes */
/* Ensure proper viewport meta tag */
<meta name="viewport" content="width=device-width, initial-scale=1.0">

/* Use responsive Tailwind classes */
.container {
  @apply px-4 sm:px-6 lg:px-8;
}

/* Test on actual devices when possible */
```

---

## 📞 Escalation Matrix

### **When to Escalate**

#### **Immediate Escalation (Call/Page)**
- Complete application outage (> 5 minutes)
- Data breach suspected
- Payment processing completely down
- Database corruption detected

#### **Email/Slack Escalation (Within 1 Hour)**
- Partial feature outages affecting multiple users
- Performance degradation > 50% slowdown
- Security incidents (non-critical)
- Integration failures (Stripe, Google, etc.)

#### **Standard Ticket Queue**
- Single user issues
- UI/UX problems
- Performance optimizations
- Feature requests

### **Contact Information**
```
Technical Lead: [Contact Info]
Product Owner: [Contact Info]
DevOps Team: [Slack Channel]
Security Team: [Emergency Contact]
```

---

## 📋 Troubleshooting Checklist Templates

### **Database Issue Checklist**
```
□ Check Supabase status page
□ Verify connection limits
□ Review recent schema changes
□ Check for long-running queries
□ Verify backup status
□ Test connection from external tool
□ Review error logs
□ Check disk space usage
```

### **Payment Issue Checklist**
```
□ Check Stripe status page
□ Verify API keys in environment
□ Test webhook endpoints
□ Review recent failed payments
□ Check webhook delivery logs
□ Verify domain configuration
□ Test payment flow manually
□ Review rate limiting
```

### **Email Issue Checklist**
```
□ Check Resend status page
□ Verify API key and permissions
□ Test domain DNS configuration
□ Review email template syntax
□ Check delivery rate metrics
□ Verify sender reputation
□ Test with different email providers
□ Review spam complaint rates
```

---

## 📚 Additional Resources

### **Monitoring Tools**
- **Application Health**: https://localloop.com/admin/analytics
- **Vercel Analytics**: Vercel Dashboard → Analytics
- **Supabase Monitoring**: Supabase Dashboard → Reports
- **Stripe Monitoring**: Stripe Dashboard → Dashboard

### **External Status Pages**
- **Vercel Status**: https://vercel-status.com
- **Supabase Status**: https://status.supabase.com
- **Stripe Status**: https://status.stripe.com
- **Resend Status**: https://resend.com/status

### **Documentation References**
- **Operations Runbook**: [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)
- **Backup Procedures**: [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md)
- **Environment Setup**: [PRODUCTION_ENVIRONMENT_SETUP.md](./PRODUCTION_ENVIRONMENT_SETUP.md)

---

**Last Updated**: January 2025
**Next Review**: Monthly
**Maintained By**: LocalLoop Technical Team 