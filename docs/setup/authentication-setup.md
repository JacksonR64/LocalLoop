# Authentication Setup Guide

This guide explains how to configure authentication providers in LocalLoop with feature toggles.

## Feature Toggles

LocalLoop uses environment variables to enable/disable authentication providers. This allows you to:
- Enable providers only when you have the required accounts/credentials
- Show "Coming Soon" UI for disabled providers
- Keep all authentication code ready for future activation

## Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration (Required for auth to work)
NEXT_PUBLIC_SUPABASE_URL=https://jbyuivzpetgbapisbnxy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieXVpdnpwZXRnYmFwaXNibnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MDY0NDIsImV4cCI6MjA1MjE4MjQ0Mn0.sGIzPdNPKG0bE7HHJZWz0tHkPOGRX7R_9eqpjWDqhOg

# Authentication Provider Toggles
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true    # Google OAuth is ready
NEXT_PUBLIC_ENABLE_APPLE_AUTH=false    # Apple requires developer account

# Google Calendar API (for calendar features)
GOOGLE_CLIENT_ID=729713375100-j6jjb5snk8bn2643kiev3su0jg6epedv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## Provider Status

### ✅ Google Authentication
- **Status**: Ready to use
- **Requirements**: Google Cloud Console project configured
- **Setup**: Add callback URL to Google Cloud Console:
  - URL: `https://jbyuivzpetgbapisbnxy.supabase.co/auth/v1/callback`
  - [Configure here](https://console.cloud.google.com/apis/credentials?project=localloop-calendar-integration)

### 🔒 Apple Authentication
- **Status**: Coming Soon (disabled by default)
- **Requirements**: Apple Developer Account ($99/year)
- **Current State**: Shows "Coming Soon" UI with lock icon
- **Code**: Fully implemented and ready to activate

## Enabling Apple Authentication (Future)

When you get an Apple Developer account:

1. **Update environment variable:**
   ```bash
   NEXT_PUBLIC_ENABLE_APPLE_AUTH=true
   ```

2. **Configure Apple Sign-In:**
   - Create App ID in Apple Developer portal
   - Enable Sign In with Apple capability
   - Configure service ID for web authentication
   - Add redirect URLs to Apple configuration

3. **Update Supabase:**
   - Add Apple as OAuth provider in Supabase dashboard
   - Configure Apple service ID and team ID
   - Add Apple private key

4. **Deploy changes:**
   The code is already in place, just change the environment variable!

## UI Behavior

### When Disabled (Apple Auth)
- Button shows grayed out with lock icon
- Displays "(Soon)" text
- Shows tooltip: "Coming soon! Requires Apple Developer account"
- Clicking shows helpful error message
- Footer text explains the requirement

### When Enabled
- Button appears normal and clickable
- Full OAuth flow works
- No visual indicators of restriction

## Technical Implementation

The feature toggle system:

1. **Environment Variables**: Controls what's enabled
2. **Auth Context**: Exposes feature flags to components
3. **UI Components**: Conditionally render based on flags
4. **Error Handling**: Graceful messaging for disabled features

### Code Structure
```
lib/auth-context.tsx     - Feature flags and auth methods
lib/config.ts           - Centralized configuration
app/auth/login/page.tsx - Login UI with toggles
app/auth/signup/page.tsx - Signup UI with toggles
```

## Testing

To test Apple auth UI (while disabled):
1. Keep `NEXT_PUBLIC_ENABLE_APPLE_AUTH=false`
2. Visit `/auth/login` or `/auth/signup`
3. See grayed out Apple button with lock icon
4. Click to see "Coming Soon" message

## Future Considerations

- **Other Providers**: Easy to add Facebook, Twitter, etc.
- **Admin Panel**: Could add UI to toggle features
- **A/B Testing**: Could be used for gradual rollouts
- **Regional Features**: Different providers per region

## Support

If you need help:
1. Check this guide first
2. Verify environment variables are set
3. Check browser console for errors
4. Ensure Supabase credentials are correct 