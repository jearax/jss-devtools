# Site screenshots

Procedures for capturing and reviewing `site/` screenshots in a browser.

- Clear a stale `jds-skin` cookie first (it overrides the site skin), scroll to top and let the
  hero's typing finish; a full-page capture draws the sticky header mid-page.
- After rebuilding, a navigation that only changes the hash serves the previous bundle; reload
  with `ignoreCache` before measuring or capturing.
- Check overflow by `scrollWidth > clientWidth`; `resize_page` can stick, use `emulate viewport`
  and verify `clientWidth`.
- Chrome MCP synthetic events do not set `:active`, so press-state screenshots need a Playwright
  script holding a real `mousedown` before the capture.
- Review every band, scrolling one viewport at a time; a first-viewport shot hides the layout
  defects below it.
- Playwright `boundingBox()` is viewport-relative; to scroll to an element use
  `getBoundingClientRect().top + window.scrollY` from `evaluate`, not the box's own y.
