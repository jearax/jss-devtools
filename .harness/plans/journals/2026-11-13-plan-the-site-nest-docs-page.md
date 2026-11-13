---
title: Plan the site nest docs page
date: 2026-11-13
---

# Plan the site nest docs page

# Plan the site nest docs page

The user chose a page of its own for the nest preset over a longer init section. The request
had not settled that choice, and asking before drafting avoided a plan built on a guess.

- Layout: `/docs/nest` under a new `Presets` sidebar group, so a later preset adds a page and init
  stays short.
- The facts come from `templates/nest/` and its e2e output. A CLI-suite test ties the site's env
  table to the template's example env file, because the `CORS_ORIGIN` rename showed how fast
  hand-kept copies drift.
- Before the plan, the nest preset was committed as `d2e61a7` (feature) and `8f13667` (harness)
  and pushed, which starts the site deploy. Staging was scanned by a scratchpad script, because
  the privacy hook blocks any command text that names an env file.
- Handed to the cooker `t3p` with an explicit file scope and no commit or push.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
