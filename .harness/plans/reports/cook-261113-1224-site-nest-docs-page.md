# Cook: the site docs give the nest preset its own page

Plan: [261113-1218-site-nest-docs-page](../261113-1218-site-nest-docs-page/plan.md) — both phases
implemented, validated, reviewed at desktop and phone width. Status marked done in `plan.md`.
Nothing committed or pushed.

## What changed

| File | Change |
| --- | --- |
| `site/src/pages/Docs/pages/Nest/Nest.constant.ts` | **New.** `NEST_SECTIONS` (7 ids through `sectionMeta`), the `src/` tree (from `templates/nest`, specs left out), `NEST_ENV_ROWS` (name, default, meaning from `.env.example` + `env.schema.ts`), the env-file order paragraphs, three response examples, the language order and curls, the health paragraphs, the `scripts` block, the monorepo paragraphs. |
| `site/src/pages/Docs/pages/Nest/NestSections.tsx` | **New.** What-it-writes (tree `CodeBlock`), environment (paragraphs + `<table>` like the presets table, `unset` as `<em>`), responses (request curl with `CopyButton` + answer JSON, per example). |
| `site/src/pages/Docs/pages/Nest/Nest.tsx` | **New.** `DocPage` assembling all seven sections; language curls block, scripts JSON block, monorepo paragraphs. |
| `site/src/pages/Docs/pages/Nest/Nest.test.tsx` | **New.** Renders every section heading, the env table rows, the three real response lines. |
| `site/src/constants/routes.constant.ts` | `nest` page in a new `Presets` group, after `harness`. |
| `site/src/pages/Docs/Docs.route.ts` | The lazy `nest` route. |
| `site/src/constants/search-index.constant.ts` | `NEST_SECTIONS` in `SECTION_LISTS` between harness and reference. |
| `site/src/pages/Docs/Docs.test.tsx` | Two tests: the sidebar shows the `Presets` group with the `nest` link; the init page links to `/docs/nest`. |
| `site/src/pages/Docs/pages/Init/Init.constant.ts` | `INIT_NEST_PARAGRAPHS` shrunk to one paragraph; the presets table stays. |
| `site/src/pages/Docs/pages/Init/InitNest.tsx` | The nest section is now the paragraph plus a `Link` to `/docs/nest`; the command block moved to the nest page. |
| `ci/smoke-site-image.sh` | `expect_status "$base/docs/nest" "200"` after the docs block. |
| `tests/site-nest-docs.test.ts` | **New, CLI suite.** Parses `.env.example` (`NAME=value`) and the `NEST_ENV_ROWS` text (read as text, not imported — 0025); asserts equal names, order, defaults; fails loudly when either parse finds zero rows. |

## Facts came from real sources

- Every response example was captured by `curl` against the built app: `init probe --framework nest
  --pm pnpm -y` in the scratchpad, `nest build`, `APP_PORT=4123 NODE_ENV=prod node dist/main.js`,
  then `GET /health/ready` (200 envelope), a malformed body with `?lang=vi` (400, **default locale —
  Express parses the body before the i18n middleware**, stated on the page), `/_nowhere?lang=en`
  (404 English), plus the three language-precedence curls (all Vietnamese).
- The locale order, env-file order, health behaviour and scripts were read from `i18n.module.ts`,
  `config.module.ts`, `app.controller.ts`, `app.e2e-spec.ts` and `package.json` in `templates/nest/`.
- The drift test earned its keep during phase 1: it failed on my first table (I wrote LOG_FORMAT
  default `''`; `.env.example` ships `pretty`) and again on the rename proof below.

## Guard proof

Renamed `APP_PORT` → `APP_PORTS` in a copy of `Nest.constant.ts`: the test failed with a names
inequality; reverted the file: the test passed. Both observed in the same command run.

## Checks (real output)

- `pnpm vitest run tests/site-nest-docs.test.ts` → 1 passed; fails on the renamed-variable proof, passes after revert
- `pnpm --dir site lint` → exit 0 (first run caught 11 prettier/import-order issues, fixed with `eslint --fix`)
- `pnpm --dir site typecheck` → exit 0
- `pnpm --dir site test` → **27 files, 128 tests passed**
- `pnpm --dir site build` → exit 0
- `pnpm lint` → exit 0
- `pnpm typecheck` → exit 0
- `pnpm test` → 33 files passed, 3 skipped; **514 passed, 19 skipped**
- `pnpm build` → exit 0
- `shellcheck ci/smoke-site-image.sh` → clean (shellcheck is not on this machine; run through the
  official `koalaman/shellcheck:stable` image)

## Screenshots (reviewed per the screenshot doc)

`.harness/plans/261113-1218-site-nest-docs-page/screenshots/`: `desktop-band-1..6.png` (1280×800,
every band scrolled and reviewed: breadcrumbs `Docs / Presets / nest`, sidebar group, TOC, all
sections, pager `harness ← nest → Reference`) and `phone-band-1.png`, `phone-band-table.png`,
`phone-band-responses.png`, `phone-band-scripts.png` (390×844). Overflow check at 390:
`scrollWidth 390 == clientWidth 390`. The JSON blocks and the env table scroll inside themselves —
the prose table carries `max-sm:overflow-x-auto` by design; no page-level horizontal scroll.

## Notes and limitations

- `shellcheck` is not installed locally; verified through the official image instead.
- The scratch probe project lives under
  `~/.claude/projects/-Users-tandm-Documents-jjuidev-tools-jss-devtools/scratchpad/nest-docs-probe/`
  and can be deleted.
- The e2e smoke of the built image (`ci/smoke-site-image.sh`) itself was not run — it needs a built
  image and docker run; the added line mirrors the neighbouring `$base/docs/install` check that
  CI exercises.

## Unresolved questions

- None.

## Review fixes appended 261113 (round 2)

Four review findings, all fixed:

1. **The false boot claim removed.** `NEST_ENV_PARAGRAPHS` no longer says an unknown variable
   fails the boot: the schema is a plain `z.object` (unknown keys are stripped, not rejected) and
   `process.env` always carries `PATH` and friends. The enum and `APP_PORT` clauses stay.
2. **`NEST_SCRIPTS` re-read from the template.** The template manifest now sorts its scripts;
   the block follows the real order and values.
3. **`Nest.constant.ts` split at 203 lines.** The example and curl constants (`NEST_RESPONSES`
   with its type, `NEST_LANGUAGE_CURLS`) moved to `NestExamples.constant.ts`; the page file is
   165 lines.
4. **The drift test now guards the scripts and the tree.** `tests/site-nest-docs.test.ts`
   gained: a scripts guard (parses the constant's template literal — evaluating its `\\"`
   escapes first — and asserts equal names, order and values against
   `templates/nest/package.json`), and a tree guard (rebuilds the stated paths from the tree's
   indentation and asserts set equality against a walk of `templates/nest/src`, `*.spec.ts`
   excluded, both directions). Guard proofs: altering one script value failed the scripts
   guard; dropping `logger/logger.service.ts` from the tree failed the tree guard; reverting
   restored 3/3 passes — all observed in one command run.

Verification, in order: `pnpm vitest run tests/site-nest-docs.test.ts` → 3 passed after the
reverts; `pnpm --dir site lint && typecheck && test && build` → exit 0, 27 files, 128 tests
(one prettier fix in `NestSections.tsx`); `pnpm lint && typecheck && test && build` → exit 0,
33 files, **516 passed**, 19 skipped (one prettier fix in the test); shellcheck clean. Nothing
committed or pushed.
