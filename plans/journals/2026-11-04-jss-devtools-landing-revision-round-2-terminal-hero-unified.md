---
title: "jss-devtools landing revision round 2 — terminal hero, unified chrome, docs IA"
date: 2026-11-04
summary: "Round 2 of the landing refactor applied the owner's 10-point review on refactor/site-landing; gate green, branch left for owner review."
---

# jss-devtools landing revision round 2 — terminal hero, unified chrome, docs IA

## What happened

Executed `agentkit/plans/261104-1729-landing-revision-round2` (in the design-system repo) against `site/` on `refactor/site-landing`. Three feature commits, none pushed:

- `6c82b45` feat(site): make the hero a live terminal — eyebrow wordmark and CTA row removed; the terminal gained `tabs` replay (install/doctor/init transcripts), a `commandCopy` icon-only affordance modeled on the design system's `ButtonCopy` `feedback="icon"`, and replay-on-tab-switch via keyed remounts. BadgeStrip and `badge.constant.ts` deleted. Below 640px the typing animation fades to a soft wrap because `white-space: nowrap` would clip the install command — the exact failure the component's own CSS comments warn about.
- `735d5d4` feat(site): rebuild the footer and unify window chrome — header Install CTA dropped; footer rebuilt as Product/Commands/Reference columns derived from `DOCS_PAGES` + `SOURCE_URL`; new shared `WindowChrome` component (dots + title bar) now worn by both `Terminal` and `CodeBlock`.
- `2fb9f11` feat(site): group the docs sidebar and redesign the pager — `DocsPage.group` field added; `DOCS_SIDEBAR_GROUPS` derived from the one constant; `Commands` is a pure header (never a link, never in the search index); new `Breadcrumbs` component; pager redesigned to the VitePress pattern after fetching starship (the ugly baseline, confirmed bare-text) — vitepress.dev and tailwindcss.com fetches failed or lacked the pager, noted honestly in the verification report.

Verification: full gate green (lint, tsc, 20 files / 95 tests, build). All 10 owner decisions walked on the running site; reduced-motion verified empirically under CDP emulation (`animation: none`, no caret); keyboard walkthrough passed (skip link → header → roving tabs → copy icon; palette navigate to `/docs/init#what-it-does`). Report: design-system `agentkit/plans/reports/verification-261105-0122-jss-devtools-landing-round2.md`, 7 screenshots alongside.

## Decision

- Chrome extraction went to a new `WindowChrome` component rather than routing `CodeBlock` through `Terminal`: CodeBlock needs none of Terminal's tabs/animation, and both keeping their bodies while sharing the bar keeps the diff on the widely-used CodeBlock props-stable.
- The install hero tab replays with no output lines: the site only carries real captured transcripts, and the installer's output was never captured — an invented transcript would break the "real output" rule.
- `exactOptionalPropertyTypes` forced `title?: string | undefined` on WindowChrome; callers pass `title` through unchanged.

## Next steps

- Owner reviews the branch diff with round-1 and round-2 reports side by side; merge/push (which deploys) is the owner's call.
- Known limitation recorded: hero terminal min-height (26rem) is tuned to the init transcript; a longer transcript will reintroduce layout shift on tab switch.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
