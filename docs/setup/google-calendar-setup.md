# Google Calendar API Setup Guide

This guide walks you through setting up Google Calendar API integration for LocalLoop.

## Overview

LocalLoop uses Google Calendar API to provide users with seamless calendar integration, allowing them to:
- Connect their Google Calendar accounts
- Automatically add LocalLoop events to their personal calendars
- Sync event updates and cancellations
- One-click "Add to Calendar" functionality

## Prerequisites

- Google account with access to Google Cloud Console
- LocalLoop development environment set up
- Basic understanding of OAuth 2.0 flow

## Step 1: Create Google Cloud Project

### 1.1 Access Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. If you haven't used Google Cloud before, accept the terms of service

### 1.2 Create New Project
1. Click on the project dropdown at the top of the page
2. Click "New Project" 
3. Enter project details:
   - **Project Name**: `LocalLoop Calendar Integration` (or similar)
   - **Project ID**: `localloop-calendar` (must be globally unique)
   - **Location**: Leave as "No organization" (unless you have a specific org)
4. Click "Create"
5. Wait for project creation to complete (usually 30-60 seconds)

### 1.3 Select Your Project
1. Once created, ensure your new project is selected in the project dropdown
2. The project name should appear at the top of the console

## Step 2: Enable Google Calendar API

### 2.1 Navigate to API Library
1. In the Google Cloud Console, open the navigation menu (☰)
2. Go to "APIs & Services" > "Library"
3. Or use this direct link: [API Library](https://console.cloud.google.com/apis/library)

### 2.2 Enable Calendar API
1. In the search bar, type "Google Calendar API"
2. Click on "Google Calendar API" from the results
3. Click "Enable" button
4. Wait for the API to be enabled (usually instant)

### 2.3 Verify API is Enabled
1. Go to "APIs & Services" > "Enabled APIs & services"
2. You should see "Google Calendar API" in the list

## Step 3: Configure OAuth Consent Screen

### 3.1 Navigate to OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Click "Create"

### 3.2 Fill Out OAuth Consent Screen
**App Information:**
- **App name**: `LocalLoop`
- **User support email**: Your email address
- **App logo**: Upload LocalLoop logo (optional)

**App domain (optional but recommended):**
- **Application home page**: `https://your-localloop-domain.com`
- **Application privacy policy link**: `https://your-localloop-domain.com/privacy`
- **Application terms of service link**: `https://your-localloop-domain.com/terms`

**Authorized domains:**
- Add your production domain: `your-localloop-domain.com`
- For development: `localhost` (add this for local testing)

**Developer contact information:**
- Add your email address

### 3.3 Configure Scopes
1. Click "Save and Continue" to go to Scopes
2. Click "Add or Remove Scopes"
3. Search for and add these scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
4. Click "Update" then "Save and Continue"

### 3.4 Test Users (Development)
1. Add test user emails (your email and team members)
2. This allows testing while your app is in development mode
3. Click "Save and Continue"

### 3.5 Review and Submit
1. Review all information
2. Click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

### 4.1 Navigate to Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"

### 4.2 Configure OAuth Client
1. **Application type**: Select "Web application"
2. **Name**: `LocalLoop Web Client`

3. **Authorized JavaScript origins**: Add these URLs:
   - `http://localhost:3000` (for development)
   - `https://your-localloop-domain.com` (for production)

4. **Authorized redirect URIs**: Add these URLs:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://your-localloop-domain.com/auth/google/callback` (for production)

### 4.3 Download Credentials
1. Click "Create"
2. Copy the **Client ID** and **Client Secret**
3. Store these securely - you'll need them for environment variables

## Step 5: Environment Variable Configuration

### 5.1 Add Google Calendar Credentials to Your Environment

After completing Steps 1-4 and obtaining your OAuth 2.0 credentials, you need to add them to your LocalLoop environment configuration.

#### Option A: Using the Automated Setup Script (Recommended)

LocalLoop includes an automated environment setup script:

```bash
# Run the environment setup script
./scripts/env-setup.sh
```

When prompted, provide your Google Calendar API credentials:
- **GOOGLE_CLIENT_ID**: Your OAuth 2.0 client ID (ends with .apps.googleusercontent.com)
- **GOOGLE_CLIENT_SECRET**: Your OAuth 2.0 client secret
- **GOOGLE_REDIRECT_URI**: `http://localhost:3000/auth/google/callback` (for development)

#### Option B: Manual Environment Configuration

If you prefer to configure manually, add these variables to your `.env.local` file:

```bash
# Create or update .env.local file
cat >> .env.local << EOF

# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
EOF
```

### 5.2 Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console | `123456789012-abcdef...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Cloud Console | `GOCSPX-abcdef123456...` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL for your application | `http://localhost:3000/auth/google/callback` |

### 5.3 Vercel Deployment Configuration

For production deployment on Vercel, add these environment variables in your Vercel dashboard:

1. Navigate to your Vercel project settings
2. Go to "Environment Variables" 
3. Add each variable:
   - **GOOGLE_CLIENT_ID**: Production Client ID
   - **GOOGLE_CLIENT_SECRET**: Production Client Secret  
   - **GOOGLE_REDIRECT_URI**: `https://yourdomain.com/auth/google/callback`

### 5.4 Security Considerations

- ✅ **Never commit** `.env.local` or `.env` files to version control
- ✅ Use different credentials for development and production environments
- ✅ Regularly rotate your OAuth client secrets
- ✅ Monitor API usage in Google Cloud Console
- ✅ Set up proper domain restrictions in production

### 5.5 Testing Your Configuration

After setting up your environment variables:

```bash
# Test that variables are loaded correctly
npm run dev

# Check the console for any environment variable errors
# The Google Calendar integration should now be accessible
```

## Step 6: Test the Integration

### 6.1 Verify Setup
1. Start your development server: `npm run dev`
2. Navigate to your app
3. Try the Google Calendar connection flow
4. Check browser console for any API errors

### 6.2 Test OAuth Flow
1. Click "Connect Google Calendar" in your app
2. You should be redirected to Google's consent screen
3. Grant calendar permissions
4. Verify successful redirect back to your app

### 6.3 Test API Calls
1. Use the test connection feature in your app
2. Verify calendar list can be retrieved
3. Test event creation (create a test event)
4. Check your Google Calendar to confirm the event appears

## Troubleshooting

### Common Issues

**1. "Invalid Client" Error**
- Verify your OAuth client ID and secret are correct
- Check that your redirect URIs match exactly
- Ensure your domain is authorized

**2. "Access Blocked" Error**
- Your app is in testing mode and the user isn't added as a test user
- Add the user email to OAuth consent screen test users
- Or publish your app for production use

**3. "Invalid Scope" Error**
- Verify you've added the correct calendar scopes
- Check that scopes are approved in OAuth consent screen

**4. "Redirect URI Mismatch"**
- Ensure redirect URIs in Google Cloud Console match your app's callback URL
- Check for trailing slashes and http vs https

### Debug Steps

1. **Check Environment Variables**: Verify all Google API credentials are properly set
2. **Verify API Enablement**: Confirm Google Calendar API is enabled in your project
3. **Test Scopes**: Ensure your app requests the correct calendar permissions
4. **Check Logs**: Review Google Cloud Console API logs for errors
5. **Validate Redirect URIs**: Confirm all redirect URIs are properly configured

## Security Best Practices

### 1. Credential Security
- Never commit API credentials to version control
- Use environment variables for all sensitive data
- Rotate credentials regularly
- Use different credentials for development and production

### 2. Token Management
- Implement proper token refresh logic
- Store tokens securely (encrypted in database)
- Handle token expiration gracefully
- Revoke tokens when users disconnect

### 3. API Limits
- Implement rate limiting in your app
- Handle API quota exceeded errors
- Cache calendar data when appropriate
- Monitor API usage in Google Cloud Console

### 4. User Privacy
- Only request necessary calendar permissions
- Allow users to disconnect their calendar
- Provide clear privacy policies
- Delete user data upon request

## Production Deployment

### 1. Publish OAuth App
1. Go to OAuth consent screen in Google Cloud Console
2. Click "Publish App"
3. Submit for verification if you have sensitive scopes
4. Wait for Google approval (can take several days)

### 2. Domain Verification
1. Add and verify your production domain
2. Update authorized domains in OAuth consent screen
3. Update redirect URIs for production

### 3. Monitoring
- Set up Google Cloud Console monitoring
- Monitor API usage and quotas
- Set up alerts for API errors
- Track OAuth success/failure rates

## API Quotas and Limits

### Default Quotas
- **Calendar API calls**: 1,000,000 requests/day
- **Per-user rate limit**: 250 queries/user/100 seconds
- **Calendar events**: 5,000,000 events/day

### Requesting Quota Increases
1. Go to Google Cloud Console > APIs & Services > Quotas
2. Find Google Calendar API quotas
3. Click "Edit" to request increases
4. Provide justification for higher limits

## Support and Resources

### Documentation
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console Help](https://cloud.google.com/docs)

### Community
- [Stack Overflow - Google Calendar API](https://stackoverflow.com/questions/tagged/google-calendar-api)
- [Google Cloud Community](https://cloud.google.com/community)

### Contact
For LocalLoop-specific issues, contact the development team or create an issue in the project repository.

---

*Last Updated: December 29, 2024*
*Version: 1.0* 