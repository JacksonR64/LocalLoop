#!/bin/bash

# 🔍 Local CI Verification Script
# This script runs the same checks as GitHub Actions CI to catch issues before pushing

set -e  # Exit on any error

echo "🚀 Running Local CI Verification..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check Node version (CI uses Node 18)
print_status "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d. -f1 | sed 's/v//')
if [ "$NODE_VERSION" != "18" ]; then
    print_warning "CI uses Node 18, you're using Node $NODE_VERSION. Consider using nvm: 'nvm use 18'"
fi

# 1. Clean install dependencies (match CI exactly)
print_status "Installing dependencies with npm ci --legacy-peer-deps (matching CI)..."
if [ -f "package-lock.json" ]; then
    npm ci --legacy-peer-deps
    print_success "Dependencies installed"
else
    print_warning "No package-lock.json found, using npm install..."
    npm install --legacy-peer-deps
fi

# 2. ESLint Check (full lint like main CI)
print_status "Running ESLint (full codebase)..."
if npm run lint; then
    print_success "ESLint passed"
else
    print_error "ESLint failed - fix these issues before pushing"
    exit 1
fi

# 3. TypeScript Check
print_status "Running TypeScript type check..."
if npm run type-check; then
    print_success "TypeScript check passed"
else
    print_error "TypeScript check failed - fix type errors before pushing"
    exit 1
fi

# 4. Build Check
print_status "Testing build process..."
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed - fix build errors before pushing"
    exit 1
fi

# 5. Unit Tests (CI configuration)
print_status "Running unit tests (CI configuration)..."
if npm run test:ci; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed - fix failing tests before pushing"
    exit 1
fi

# 6. Check for changed files (simulate PR quick feedback)
print_status "Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Commit them before pushing."
    git status --short
fi

# 7. Check against main branch (simulate PR diff)
print_status "Checking changes against main branch..."
if git remote get-url origin > /dev/null 2>&1; then
    git fetch origin main:main 2>/dev/null || git fetch origin main 2>/dev/null || true
    
    CHANGED_FILES=$(git diff --name-only main...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null || echo "")
    if [ ! -z "$CHANGED_FILES" ]; then
        print_status "Changed files detected, running targeted ESLint..."
        echo "$CHANGED_FILES" | tr '\n' ' '
        echo ""
        
        # Run ESLint on changed files only (like PR quick feedback)
        if echo "$CHANGED_FILES" | xargs npx eslint 2>/dev/null; then
            print_success "Changed files ESLint passed"
        else
            print_error "ESLint failed on changed files"
            exit 1
        fi
    else
        print_success "No JS/TS files changed since main"
    fi
fi

# 8. Optional: Basic E2E smoke test
read -p "🎭 Run basic E2E smoke test? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Installing Playwright browsers (Chromium only)..."
    npx playwright install chromium
    
    print_status "Starting development server for E2E test..."
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to start
    print_status "Waiting for server to be ready..."
    npx wait-on http://localhost:3000 --timeout 30000
    
    print_status "Running basic smoke test..."
    if npx playwright test --project="Desktop Chrome" e2e/example.spec.ts; then
        print_success "Smoke test passed"
    else
        print_warning "Smoke test failed - check E2E tests before pushing"
    fi
    
    # Cleanup
    kill $DEV_PID 2>/dev/null || true
fi

echo ""
echo "=================================================="
print_success "🎉 Local CI verification complete!"
echo ""
print_status "Summary of checks performed:"
echo "  ✅ Node.js version check"
echo "  ✅ Clean dependency install (npm ci --legacy-peer-deps)"
echo "  ✅ ESLint (full codebase)"
echo "  ✅ TypeScript type checking"
echo "  ✅ Production build"
echo "  ✅ Unit tests (CI configuration)"
echo "  ✅ Changed files ESLint"
echo "  🎭 E2E smoke test (optional)"
echo ""
print_success "Your code should pass GitHub Actions CI! 🚀"
print_status "Run this script before every push to catch issues early."