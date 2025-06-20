# 🚀 Production Environment Configuration Guide

## 📋 Overview

This guide provides a comprehensive setup for LocalLoop V0.3 production environment variables, security configurations, and deployment best practices.

## 🔧 Required Environment Variables

### **📊 Core Application**
```bash
# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Feature Toggles
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
NEXT_PUBLIC_ENABLE_APPLE_AUTH=false
```

### **🗄️ Supabase Database & Authentication**
```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **📅 Google Calendar API Integration**
```bash
# Google OAuth Credentials (Required for Calendar Integration)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
GOOGLE_CALENDAR_ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### **💳 Stripe Payment Processing**
```bash
# Stripe Configuration (Required for Paid Events)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### **📧 Email Service (Resend)**
```bash
# Email Configuration (Required for Notifications)
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@your-domain.com
```

### **🔧 Optional Configuration**
```bash
# Performance & Analytics
ANALYZE=false
TEST_BASE_URL=https://your-domain.com

# Development/Debug (Production: Should be disabled)
# NEXT_PUBLIC_DEBUG_MODE=false
```

## 🛡️ Security Considerations

### **1. Environment Variable Validation**
The application includes built-in validation for critical environment variables:

```typescript
// Validated at startup in middleware.ts
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables')
}
```

### **2. Sensitive Data Handling**
- **Never commit** `.env` files containing secrets to version control
- Use **encrypted** storage for Google Calendar tokens
- Store **service role keys** securely on server-side only
- Implement **rate limiting** for API endpoints

### **3. HTTPS Requirements**
- **All external APIs require HTTPS** in production
- Google OAuth **will not work** with HTTP URLs
- Stripe webhooks **require HTTPS** endpoints

## 🚀 Deployment Platform Configuration

### **Vercel (Recommended)**

1. **Environment Variables Setup:**
   ```bash
   # Add via Vercel Dashboard or CLI
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   vercel env add STRIPE_SECRET_KEY
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add RESEND_API_KEY
   ```

2. **Current Vercel Configuration:**
   ```json
   {
     "env": {
       "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
       "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
       "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
     }
   }
   ```

3. **Security Headers (Already Configured):**
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "X-Content-Type-Options", "value": "nosniff" },
           { "key": "X-Frame-Options", "value": "DENY" },
           { "key": "X-XSS-Protection", "value": "1; mode=block" }
         ]
       }
     ]
   }
   ```

### **Environment Variable Size Limits**
- **Vercel**: 64KB total for all environment variables
- **General Rule**: Keep individual variables under 4KB
- **Large Configs**: Use external secret management for large configurations

## ✅ Production Validation Checklist

### **1. Environment Variable Validation**
```bash
# Test environment variables are loading correctly
curl https://your-domain.com/api/test-env
```

**Expected Response:**
```json
{
  "stripe_webhook_secret": "SET",
  "resend_api_key": "SET", 
  "node_env": "production"
}
```

### **2. API Integrations Testing**
- [ ] **Supabase**: Authentication and database connections
- [ ] **Google Calendar**: OAuth flow and event creation
- [ ] **Stripe**: Payment processing and webhook handling
- [ ] **Resend**: Email delivery for notifications

### **3. Security Validation**
- [ ] **HTTPS**: All external API calls use HTTPS
- [ ] **Headers**: Security headers properly configured
- [ ] **Secrets**: No secrets exposed in client-side code
- [ ] **Rate Limiting**: API endpoints properly protected

### **4. Performance Validation**
- [ ] **Build Size**: Verify bundle size is optimized
- [ ] **Environment Loading**: Variables load efficiently at runtime
- [ ] **Memory Usage**: No memory leaks from large configurations

## 🔧 Production Environment Management

### **1. Secret Rotation**
```bash
# Update sensitive credentials periodically
# 1. Google OAuth Credentials (yearly)
# 2. Stripe API Keys (as needed)
# 3. Database Passwords (quarterly)
# 4. Encryption Keys (as needed)
```

### **2. Monitoring & Alerts**
- **Environment Variable Validation**: Monitor for missing variables
- **API Key Expiration**: Set up alerts for key rotation
- **Rate Limiting**: Monitor for API quota usage
- **Error Tracking**: Monitor for environment-related errors

### **3. Backup Strategy**
- **Documentation**: Keep secure documentation of all production variables
- **Recovery**: Maintain secure backup of working configurations
- **Testing**: Regular validation of production environment setup

## 🚨 Troubleshooting

### **Common Production Issues:**

1. **"Missing environment variables" Error**
   - Verify all required variables are set in production
   - Check variable names match exactly (case-sensitive)
   - Ensure NEXT_PUBLIC_ prefix for client-side variables

2. **Google Calendar OAuth Fails**
   - Verify GOOGLE_REDIRECT_URI uses HTTPS and correct domain
   - Check Google Cloud Console OAuth settings
   - Confirm redirect URI is added to Google OAuth credentials

3. **Stripe Webhooks Failing**
   - Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
   - Ensure webhook endpoint uses HTTPS
   - Check webhook events are configured correctly

4. **Email Notifications Not Sending**
   - Verify RESEND_API_KEY is valid and active
   - Check RESEND_FROM_EMAIL uses verified domain
   - Monitor Resend dashboard for delivery issues

## 📋 Production Deployment Steps

1. **Environment Setup**
   - Configure all required environment variables
   - Validate using the checklist above
   - Test in staging environment first

2. **DNS & Certificates**
   - Configure custom domain
   - Ensure SSL certificates are valid
   - Update all callback URLs to production domain

3. **External Service Configuration**
   - Update Google OAuth redirect URIs
   - Configure Stripe webhook endpoints
   - Set up Resend domain authentication

4. **Final Validation**
   - Run comprehensive integration tests
   - Verify all user flows work end-to-end
   - Monitor initial production traffic

---

## 📞 Support

For environment configuration issues:
1. Check this documentation first
2. Verify against the validation checklist
3. Test in staging environment
4. Monitor application logs for specific error messages

**Last Updated:** January 15, 2025
**Compatible with:** LocalLoop V0.3 (91.7% Complete) 