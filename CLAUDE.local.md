## Project Structure and Resources

- LocalLoop project has a local memory tracking system using this markdown file
- Key resources for development and documentation:
  - This CLAUDE.local.md file serves as a central memory and documentation point
  - Track project insights, development notes, and important contextual information here
  - Memories can be added incrementally to capture project knowledge
  - Designed to be a living document that grows with the project's development

## Development Workflow

- When starting or restarting dev server, use iTerm MCP (usually already open and running)
  - If not already open, open and start the MCP terminal
- When needing dev server started or restarted, use iterm mcp tool
  - The dev server is probably already running
  - Can start a new dev server with webhooks on using `npm run dev:with-stripe`

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