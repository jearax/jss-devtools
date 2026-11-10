---
phase: 2
title: The rest of the landing
status: completed
---

# Phase 2: The rest of the landing

## Steps

1. **Three commands** band: three columns inside the frame, divided by hairlines, each a single link
   target with hover (surface token), press and focus. Mono command name, one-line job, three facts
   from the docs pages, arrow link that moves on hover (motion-reduce off).
2. **What lands in your repository**: a file tree component (mono, tree glyphs, `.harness/` expanded to
   its first level) built from the file lists in decisions 0030 and 0031, beside three short points
   (memory, decisions, plans). A list in constants, not hand-drawn markup, with a test that keeps it
   to real paths.
3. **Closing band**: the install block again (reuse the hero component), `Getting started` primary and
   `Read the docs` secondary.
4. No footer: delete `SiteFooter`, its test and its use in `Layout`; give the back-to-top button the
   design system's spacing without one.
5. One orchestrated entrance on load (hero lines, then the terminal), 200 to 300ms, none on scroll
   beyond a simple reveal; everything visible without it.
6. Remove what the brief replaces: the old cards, the dot pattern, the old closing CTA. Delete unused
   components and their tests rather than leaving them.
7. Update component tests for every new behaviour (tablist keys, replay, install scroll-and-focus,
   file tree content).
