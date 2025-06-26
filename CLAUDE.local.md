## Project Structure and Resources

- LocalLoop project has a local memory tracking system using this markdown file
- Key resources for development and documentation:
  - This CLAUDE.local.md file serves as a central memory and documentation point
  - Track project insights, development notes, and important contextual information here
  - Memories can be added incrementally to capture project knowledge
  - Designed to be a living document that grows with the project's development

## Development Workflow

### Tmux Session Management (CRITICAL)
- **ALWAYS use tmux sessions** for development servers for better monitoring and management
- **Use regular Bash tool** for tmux commands (not iTerm MCP)
- **MANDATORY: Attach user iTerm for log monitoring**
  1. First, start tmux sessions with Bash tool
  2. Then attach user's iTerm to dev session: `tmux attach -t localloop-dev`
  3. Verify attachment successful (tmux status bar visible)
  4. User can see real-time logs while Claude uses Bash tool for commands
- **Current tmux sessions**:
  - `localloop-dev`: Next.js dev server + Stripe webhooks (`npm run dev:with-stripe`) - USER ATTACHED via iTerm
  - `browser-server`: Browser tools MCP server (port 3025)

### Commands for Development
- **Check tmux sessions**: `tmux list-sessions`
- **View dev server logs**: `tmux capture-pane -t localloop-dev -p | tail -20`
- **View browser server logs**: `tmux capture-pane -t browser-server -p | tail -20`
- **Restart dev server**: `tmux kill-session -t localloop-dev && tmux new-session -d -s localloop-dev 'npm run dev:with-stripe'`
- **Attach to session**: `tmux attach -t localloop-dev` (Ctrl+B then D to detach)

### Pre-Testing Protocol (MANDATORY)
**Before any manual testing, ALWAYS:**
1. Check if dev server is running: `tmux list-sessions`
2. If not running, start dev server in tmux: `tmux new-session -d -s localloop-dev 'npm run dev:with-stripe'`
3. **MANDATORY**: Attach user's iTerm to dev session: `tmux attach -t localloop-dev` (use iTerm MCP)
4. Verify attachment successful (look for tmux status bar in user's iTerm)
5. Verify server is ready: `tmux capture-pane -t localloop-dev -p | tail -10` (look for "Ready in XXXms")
6. Test connectivity: `curl -s http://localhost:3000 > /dev/null && echo "✅ Ready for testing"`
7. Only then proceed with manual testing

### When Making Code Changes
- **After significant changes**, restart the dev server to ensure clean state
- Use `tmux capture-pane -t localloop-dev -p | tail-15` to check for compilation errors
- Monitor logs during testing for real-time feedback

## Playwright and Automation

- When using Playwright MCP tools, utilize the existing helper function for login to streamline authentication processes

## Search Bar UI/UX Challenges

- Current search bar implementation has several UI/UX issues:
  - Search bar is fixed in position and does not scroll smoothly like the top navigation menu
  - Abrupt jump off-screen when scrolling past top navigation bar
  - Regression in scrolling behavior - no longer scrolls up as it previously did
  - Needs refinement to create a more gradual and intuitive scrolling experience

- Search Bar Behavior - Final Working Implementation:

  ✅ FIXED: Search bar animation and scroll behavior
  
  Animation Solution:
  - Used CSS classes instead of inline styles for smooth transitions
  - Proper sequence: mount with base class → next frame add active class
  - Classes: filter-expand-enter, filter-expand-enter-active, filter-expand-exit, filter-expand-exit-active
  - Timing: Use requestAnimationFrame for state changes to ensure proper browser reflow

  Scroll Behavior Solution:
  - Only scroll when user types or applies filters (not on search button click)
  - Calculate scroll offset based on search bar state (expanded vs collapsed)
  - Remove scroll-to-top behavior on Enter key press
  - Smart offset calculation: baseHeight + (expandedFiltersHeight if applicable)

  Key Technical Insights:
  - Inline style transitions don't work well when state changes happen in same render cycle
  - CSS classes with requestAnimationFrame provide better transition control
  - Need to account for dynamic component height when calculating scroll positions
  - Separate user intent (click vs type) for different scroll behaviors

- Search Functionality Unification - COMPLETE:

  ✅ UNIFIED: Both hero and top nav search now work identically
  
  Unified Behavior:
  - Both searches now create dedicated "Search Results" sections
  - Hide all other content sections when search has active filters
  - Auto-scroll to search results with proper offset calculation
  - Same grid layout and "Search Results (X)" titles
  - Consistent "No Results Found" messaging
  
  Implementation Details:
  - Separate state management: compactSearchResults vs searchResults
  - Conditional rendering: hide sections when (isSearchOpen && hasActiveCompactFilters)
  - Smart scroll targets: scroll to compact-search-results-section
  - Preserved all CompactSearchBar animations and styling
  - Results positioned directly below search box (expanded or compact)

## Performance & Console Issues - RESOLVED ✅

- **Performance Metrics Issue (FIXED)**: Browser console warnings about "Invalid page load metrics" and "Page load events not yet complete"
  - **Root Cause**: Performance API timing calculations occurring before page load events completed
  - **Solution**: Implemented robust retry mechanism in `lib/utils/performance.ts:142-217`
    - Added retry logic with 100ms intervals and 10 retry maximum (1 second total)
    - Check that `loadEventEnd` and `domContentLoadedEventEnd` > 0 before calculating metrics
    - Use `Math.max(0, ...)` to ensure positive values for all timing calculations
    - Graceful fallback: silently give up after max retries (no warnings)
  - **Result**: NO console warnings or errors - completely clean browser console

- **Permissions Policy Violation (FIXED)**: "Potential permissions policy violation: payment is not allowed in this document"
  - **Root Cause**: `next.config.ts:89` had `payment=()` blocking all payment functionality
  - **Solution**: Environment-specific permissions policy:
    - **Development**: `payment=*` (allows all origins for Stripe flexibility)
    - **Production**: `payment=(self)` (secure same-origin only)
  - **Result**: Stripe integration works without console warnings in both environments

- **Browser Console Status**: Clean - no errors or warnings (only expected Stripe HTTPS development notice)

## Form Accessibility Improvements - IN PROGRESS ✅

### ✅ **COMPLETED FIXES:**

- **Login Form (`/auth/login/page.tsx`)**: 
  - Added unique IDs: `login-email`, `login-password`
  - Added proper `name` attributes: `email`, `password`
  - Added screen reader labels with `htmlFor` associations
  - Added `autoComplete` attributes for better UX
  
- **Signup Form (`/auth/signup/page.tsx`)**:
  - Added unique IDs: `signup-email`, `signup-password` 
  - Added proper `name` attributes: `email`, `password`
  - Added screen reader labels with `htmlFor` associations
  - Added `autoComplete` attributes (email, new-password)

- **Contact Form (`/contact/page.tsx`)**:
  - Added unique IDs: `contact-firstName`, `contact-lastName`, `contact-email`, `contact-subject`, `contact-message`
  - Added proper `name` attributes for all fields
  - Added `autoComplete` attributes for better UX

- **Stripe Webhook Handler (`/api/webhooks/stripe/route.ts`)**:
  - Added `charge.updated` event handler to eliminate unhandled webhook warnings

### 🚨 **REMAINING CRITICAL ISSUES (from Accessibility Audit):**

1. **Button Accessibility (Critical)**:
   - Share, favorite, and quantity +/- buttons missing accessible names
   - Need `aria-label` attributes on icon-only buttons

2. **Quantity Input Labels (Critical)**:
   - Number inputs for ticket quantities missing proper labels
   - Need explicit label associations

3. **Viewport Meta Tag (Critical)**:
   - `user-scalable=no` prevents zoom accessibility
   - Need to allow user scaling for accessibility

4. **Color Contrast (Critical)**:
   - Gray text on dark background insufficient contrast (2.28:1, needs 4.5:1)
   - Need to adjust text colors for WCAG compliance

5. **Skip Link Target (Critical)**:
   - Skip link points to non-existent `#main-content`
   - Need to add proper skip link target

### 📊 **Current Accessibility Score**: 75/100 (up from previous baseline)
### 🎯 **Target**: 90+ for WCAG compliance

## Anti-Reward-Hacking Guidelines

🛠️ Anti-reward-hacking guidelines:

- **High-quality, general-purpose solutions** only – no test-case shortcuts, special‑casing, or hard‑coding of values.
- **If tests are broken, impossible, or unreasonable**, do not hack around them – instead *raise an alert*. Explain why it's infeasible.
- **Do not suppress or ignore warnings or errors silently.** If a warning/error arises, identify and fix the root cause—not hide it.
- Think through all edge cases; ensure solutions handle both common and unexpected inputs.
- **No quick fixes to get past tests or prototypes.** Favour correctness and maintainability.
- If an implementation requires assumptions, declare them explicitly and validate with comments and/or runtime checks.

## Thinking and Problem-Solving Strategy

🧠 Always use ultra-thinking mode

- **Always begin thinking using "ultrathink".** This triggers maximum thinking budget before responding.
- **Never shortcut reasoning.** Avoid quick fixes, suppressed errors, or warnings—take the time to deeply analyse.
- **Explicit planning step required.** Use "ultrathink" to outline approach, evaluate edge cases, and iterate before coding.
- **Errors/warnings exposed, not hidden.** If anything fails, include the explanation and next steps.
- **Document assumptions and validate.** Use runtime checks or comments to make assumptions clear.