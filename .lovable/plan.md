# Smoother, faster page switching

## Changes
- Replace the large full-page loading placeholder with a lightweight transition fallback that preserves the current background and avoids visual jumps.
- Add a subtle route-entry fade that respects reduced-motion settings.
- Preload likely page bundles when visitors hover, focus, or touch navigation links, so the next page is ready sooner.
- Keep all existing routes, content, authentication, and admin access behavior unchanged.

## Verification
- Confirm the project builds cleanly.
- Test desktop and phone navigation for smooth transitions, top-of-page positioning, and no blank screen.

## Technical details
- Reuse the existing lazy page imports through named preload functions.
- Apply transitions at the route-content boundary rather than delaying navigation.
