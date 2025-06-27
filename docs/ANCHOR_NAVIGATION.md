# Anchor Navigation System

## Overview

This system provides reliable cross-device anchor navigation that accounts for the fixed navigation bar. It's used primarily for the payment success flow but works for any page section anchors.

## How It Works

### 1. URL Fragment Navigation
- Uses Next.js `router.replace('#anchor-id')` for navigation
- Browser automatically scrolls to anchored elements
- Works in all environments: localhost, IP addresses, production

### 2. CSS Scroll Offset
- `scroll-margin-top` property creates space above anchored content
- Calculated as: `64px (nav height) + 16px (buffer) = 80px`
- Ensures content appears below the fixed navigation

### 3. Accessibility Features
- Smooth scrolling with `scroll-behavior: smooth`
- Respects `prefers-reduced-motion` for accessibility
- Progressive enhancement with fallbacks

## Available Anchors

| Anchor ID | Section | Usage Example |
|-----------|---------|---------------|
| `#payment-success` | Payment success card | `/events/123#payment-success` |
| `#about` | Event description | `/events/123#about` |
| `#location` | Map/location | `/events/123#location` |
| `#calendar` | Google Calendar | `/events/123#calendar` |
| `#tickets` | Ticket selection | `/events/123#tickets` |
| `#rsvp` | RSVP section | `/events/123#rsvp` |

## Implementation

### Adding New Anchors

1. **Add ID to component:**
   ```tsx
   <Card id="new-section" data-test-id="new-section-card">
   ```

2. **Add to CSS selector:**
   ```css
   #payment-success,
   #about,
   #new-section {  /* Add your new anchor here */
     scroll-margin-top: var(--anchor-scroll-offset);
   }
   ```

3. **Test the anchor:**
   - Direct URL: `/events/123#new-section`
   - Programmatic: `router.replace('#new-section')`

### Adjusting Navigation Height

If the navigation height changes, update the CSS custom property:

```css
:root {
  --nav-height: 64px; /* Update this value */
  --anchor-buffer: 16px;
  --anchor-scroll-offset: calc(var(--nav-height) + var(--anchor-buffer));
}
```

## Browser Support

- **Modern browsers**: Full support with CSS custom properties
- **Older browsers**: Automatic fallback to fixed 80px offset
- **Mobile Safari**: Tested and working on iOS devices
- **Chrome Dev Tools**: Compatible with mobile simulation

## Testing

### Manual Testing
```bash
# Development
http://localhost:3000/events/[id]#payment-success

# Local network
http://192.168.1.x:3000/events/[id]#payment-success

# Production
https://domain.com/events/[id]#payment-success
```

### Automated Testing
The E2E tests in `/e2e/` folder validate anchor positioning across devices.

## Troubleshooting

### Anchor Not Scrolling
1. Check element has correct `id` attribute
2. Verify CSS selector includes the anchor ID
3. Test with different `--anchor-buffer` values

### Wrong Positioning
1. Measure actual navigation height in browser dev tools
2. Adjust `--nav-height` CSS custom property
3. Test across different viewport sizes

### Environment Issues
1. Ensure `router.replace('#anchor')` syntax (not full URLs)
2. Check for JavaScript errors in console
3. Verify Next.js router is available in component

## Performance

- **Zero JavaScript overhead**: Uses native browser anchor scrolling
- **CSS-only offsets**: No runtime calculations
- **Progressive enhancement**: Works even if JavaScript fails
- **SEO-friendly**: URL fragments are crawlable and bookmarkable