# Environment Variables Setup Guide

## 📁 File Structure Overview

LocalLoop follows Next.js standard environment file conventions:

```
LocalLoop/
├── .env                    # Server-side only, committed to git
├── .env.local             # Local development, gitignored (ADD YOUR SECRETS HERE)
├── .env.example           # Template showing required variables, committed to git
├── .env.backup            # Backup of working configuration
└── .gitignore             # Contains .env* (protects secrets)
```

## 🎯 Which File to Use When

### **`.env.local` - YOUR MAIN FILE** 
- **Purpose**: Local development secrets and overrides
- **Git Status**: ❌ Gitignored (safe for secrets)
- **Usage**: Add all your API keys and local configuration here
- **Next.js**: Automatically loaded, highest priority

### **`.env` - SHARED CONFIG**
- **Purpose**: Non-secret environment variables shared across team
- **Git Status**: ✅ Committed (NO SECRETS!)
- **Usage**: Default URLs, feature flags, public configuration

### **`.env.example` - TEMPLATE**
- **Purpose**: Shows what variables are needed
- **Git Status**: ✅ Committed
- **Usage**: Copy to `.env.local` and fill in real values

### **`.env.backup` - SAFETY NET**
- **Purpose**: Working configuration backup
- **Git Status**: ❌ Gitignored
- **Usage**: Restore if `.env.local` gets corrupted

## 🔧 Current Configuration

### **What's in `.env.local` (your main file):**
```bash
# Next.js Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration (Required for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://jbyuivzpetgbapisbnxy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Calendar API Configuration
GOOGLE_CLIENT_ID=729713375100-j6jjb5snk8bn2643kiev3su0jg6epedv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Authentication Provider Feature Toggles
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
NEXT_PUBLIC_ENABLE_APPLE_AUTH=false
```

## 🚨 Important Notes

### **NEXT_PUBLIC_ Prefix**
- Required for browser access (client-side)
- Without this prefix, variables are server-side only
- Supabase auth needs `NEXT_PUBLIC_` to work in components

### **Security Best Practices**
- ✅ Keep secrets in `.env.local` only
- ❌ Never commit API keys to git
- ✅ Use `.env.example` for documentation
- ✅ Restart dev server after changing environment variables

## 🔄 Loading Order (Next.js Priority)

1. `.env.local` (highest priority)
2. `.env.development` (if in development)
3. `.env` (lowest priority)

Variables in higher priority files override lower ones.

## 🛠️ Troubleshooting

### **Environment Variables Not Loading?**
1. Check file is named exactly `.env.local` (no extra extensions)
2. Restart dev server: `npm run dev`
3. Verify syntax: `VARIABLE_NAME=value` (no spaces around =)
4. Check gitignore isn't affecting the wrong files

### **Feature Toggles Not Working?**
1. Ensure `NEXT_PUBLIC_` prefix for client-side access
2. Restart dev server after changes
3. Check browser dev tools for the variable values

### **Authentication Issues?**
1. Verify Supabase variables have `NEXT_PUBLIC_` prefix
2. Check Supabase URL ends without trailing slash
3. Confirm API keys are not truncated

## 🎮 For AI Assistants

When working with this project:

1. **Primary File**: Always check `.env.local` first for current configuration
2. **Adding Variables**: Use terminal commands to append to `.env.local`
3. **File Locations**: All .env files are in project root (`/Users/jacksonrhoden/Code/LocalLoop/`)
4. **Security**: Never attempt to read secret values, only verify structure
5. **Restart Required**: Remind user to restart dev server after env changes

### **Safe Commands for Environment Variables:**
```bash
# Check what .env files exist
ls -la | grep -E "\.env"

# Add new variables safely
echo "NEW_VARIABLE=value" >> .env.local

# Verify file structure (without exposing secrets)
head -5 .env.local

# Restart dev server
pkill -f "next dev" && npm run dev
```

## 📝 Quick Setup Checklist

For new developers:

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in real API keys in `.env.local`
- [ ] Add Supabase credentials with `NEXT_PUBLIC_` prefix
- [ ] Set feature toggles as needed
- [ ] Restart dev server
- [ ] Test authentication flows

---

This structure is standard Next.js practice and provides good security while keeping configuration manageable. 