---
phase: 3
title: "Docs: site and CLI"
status: done
---

# Phase 3: site and CLI docs

## Steps

1. **Site `/docs/nest`** (`site/src/pages/Docs/pages/Nest/`): routes become `/api/v1/courses`; say
   health stays `/health/ready` and every 404 is the envelope; mention `--no-sample`; response
   examples re-captured from a real run. `tests/site-nest-docs.test.ts` keeps its rules.
2. **Site init docs**: the init page's flag list gains `--no-sample` (nest only).
3. **CLI docs**: `README.md` nest paragraph and flags; `.harness/docs/project-roadmap.md` nest
   section; capture transcripts again only if a shown one changed.

## Validation

- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`
- `pnpm vitest run tests/site-nest-docs.test.ts`
- Screenshots of the changed bands, per `.harness/docs/site-screenshots.md`.
