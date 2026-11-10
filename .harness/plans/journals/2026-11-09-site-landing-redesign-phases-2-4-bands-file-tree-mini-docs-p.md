---
title: "Site landing redesign phases 2-4: bands, file tree, mini docs, proof"
date: 2026-11-09
summary: "CommandsBand/FileTree/InstallBlock rebuilt inside the design system; docs got selected-marker sidebar, disclosure drawer, bordered pager; all checks green"
---

# Site landing redesign phases 2-4: bands, file tree, mini docs, proof

## What happened
- Phase 2: FeatureRow cards replaced by a hairline-framed CommandsBand; InstallBlock extracted from Hero and reused in the closing band; FileTree + repository-tree.constant drawn from decisions 0030/0031; hero entrance staggered in CSS only.
- Phase 3: sidebar selected marker, table header surface, bordered pager, mobile disclosure drawer (native button, `max-lg:hidden!` needed because `.list` display:flex outranked a plain `max-lg:hidden` in source order).
- Phase 4: render-check on home + 2 docs pages — only favicon 404 remains (pre-existing); fixed a React duplicate-key in FileTree; overflow/gutter measured clean at 390/1440; 103 vitest-browser tests pass; screenshots matrix + hover/press/focus state shots captured with a Playwright script.
- Planner round 2 fixes en route: tab labels init/doctor/harness with real transcripts, fixed terminal body at desktop (eyebrow top stable at 200px across tabs), one-line install command with mask fade, text-heading-3xl (text-display is serif), glow as bg-primary/10 + blur-3xl.

## Decision
- Kept planner-accepted patterns: inline CSS-variable style for per-line animation values, hex inside the skin scale, bg-raised/90.
- FileTree test reads no fs (browser mode); it asserts structure and decision-named paths via the constant.

## Next steps
- Planner review of phase 2-4 report; favicon 404 fix untouched (pre-existing).
- SearchPalette arbitrary values now match DS CommandPalette values (top-[12vh], w-[min(36rem,...)], 60dvh) per planner instruction.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
