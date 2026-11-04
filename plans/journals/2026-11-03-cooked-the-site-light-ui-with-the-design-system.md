---
title: Cooked the site light UI on the design system
date: 2026-11-03
summary: The landing page is now five components on the design system's components, with the page's constants in one file and the design system's own components doing the work.
---

# Cooked the site light UI on the design system

## What happened

The Home page went from one JSX file to five components under `site/src/pages/Home/components/`,
each with its own `styles.module.css`, plus `Home.constant.ts` for every fixed value the page
shows. The header and the install block are the design system's own `Logo`, `ThemeToggle` and
`ButtonCopy`; nothing was reimplemented.

Three things cost more time than the plan expected.

**The plan's layout sketch did not fit the design system's components as drawn.** The sketch showed
a compact `[⧉]` copy button. `ButtonCopy` has two feedback modes and the compact one, `icon`, keeps
the glyph at `opacity: 0` until hover, so a standalone button in the install block renders as an
empty bordered box. The design system uses `icon` for `TokenChip`, where the chip itself is the
target and the icon is only a hint; a separate button in a hero is a different context. The site
uses `feedback="label"`, the package's default and fully supported mode, so the button always shows
the copy icon and the word "Sao chép". The site does not override the package's CSS to force the
glyph visible: the plan forbids working around a component in the site.

**`wrapper` is wider than a landing page, and `max-w-*` beats it.** The package's `wrapper`
utility is 1440px at 2xl and 1320px at 1280px, so it never binds on a normal screen. Putting
`max-w-3xl` on the same element narrows the band to a reading column, and the utility layer puts
the max-width after the custom `wrapper` utility, so the narrower one wins. Without it the header
sat at the page gutter and the content at the centre of a 768px column, and the two did not line
up.

**The copy button's accessible name is the label plus the subject, not the label plus the status.**
`ButtonCopy` renders the status twice: as the visible label and again in a `role="status"` span.
Playwright's accessible-name computation keeps the span out of the name, so the name is "Sao chép
lệnh cài đặt" and then "Đã sao chép lệnh cài đặt", not the status twice. That was worth a test.

## Decisions

- The presentation-only parts (`Hero`, `Requirements`, `SiteFooter`) are covered by the page test
  instead of by snapshots. The site has no snapshot convention; the design system's rule T12 was
  left out when the site was set up, and a snapshot of a whole page is forbidden.
- `Home` is a `<div>` that holds the `<header>`, the `<main>` and the `<footer>`. A `<main>` cannot
  hold a `<header>` and a `<footer>` as siblings.
- The copy button is tested against the real clipboard. The browser provider grants the clipboard
  permissions, so nothing is mocked.
- The user kept `feedback="label"` for the copy button: the compact `[⧉]` of the plan's sketch does
  not ship, because the design system's `icon` mode shows its glyph only on hover.
- The user dropped the sentence "Cài đặt cho user hiện tại, không cần sudo:" for good; it does not
  come back.
- The planner's review caught a wrong fact: the requirement line said `~/.local/bin/jss-devtools trong
  PATH`. `PATH` holds directories. The installer writes the `jss-devtools` shim into `~/.local/bin`
  and checks that the directory is on `PATH`, so the line reads `~/.local/bin trong PATH` now.

## Next steps

The planner reviews and commits. The design system's `icon` feedback mode and the `wrapper` width
are reported for the design system's own backlog, not fixed here.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
