# Cook: nest phase 2 — embedding and pins

Plan: [261112-1647-init-nest-preset](../261112-1647-init-nest-preset/plan.md) · Phase:
[phase-02-templates-and-pins.md](../261112-1647-init-nest-preset/phase-02-templates-and-pins.md) ·
Phase 1 evidence: [proof-261112-nest-template.md](proof-261112-nest-template.md)

Status: done. Every check below was run for real; nothing committed or pushed.

## Outcome

`templates/nest/` now rides in the build as data, unit tests see the same data, and the pin
script is the only writer of the Nest versions. The pin run moved the four packages published
2026-11-12 down to 12.4.2 (the newest release older than one day), wrote caret ranges into
`templates/nest/package.json`, and needed no `minimumReleaseAgeExclude` anywhere — the pins are
old enough that a fresh pnpm resolution adds none. The phase 1 proof was re-run on a fresh
scratch copy with pnpm: install, lint, typecheck, test (8), test:e2e (7), build, prettier --check
and the serve proof all pass on the moved pins.

## What changed

| File                                                            | Change                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `scripts/framework-template.mjs` (+ `.d.mts`)                   | New reader: walks `templates/<framework>/`, skips `node_modules/`, `dist/`, lockfiles and anything `git check-ignore` matches, returns a sorted `{ path: content }` map keyed relative to the template root. |
| `scripts/pin-helpers.mjs` (+ `.d.mts`)                          | New: the npm-view, version-parsing, comparator, age-filter helpers extracted from the pin script, plus `NEST_DEPENDENCIES` and `NEST_DEV_DEPENDENCIES`. |
| `scripts/pin-node-preset.mjs`                                   | 394 → 275 lines. Peers, age filter and the engines check now cover the Nest packages (`ALL_PINNED`); writes the Nest pins into `templates/nest/package.json` as carets; a final `peerConflict()` re-check throws if the age step-down broke a peer edge. |
| `tsdown.config.ts` / `vitest.config.ts`                         | `__NEST_TEMPLATE__` defined from the reader; vitest gets the real map, sorted keys for a reproducible bundle. |
| `src/commands/init/constants/nest-template.constant.ts`         | `declare const` + `NEST_TEMPLATE_FILES` export, mirroring `hook-bundle.constant.ts`. |
| `tests/nest-template.test.ts`                                   | New: map equals folder, sorted keys, no `node_modules`/`dist`/lockfile/`.env`/`AGENTS.md`/`.oxlintrc.json` path, every Nest pin a caret, no shared-toolchain duplicate. |
| `eslint.config.mjs`                                             | `no-restricted-imports` gains `!../scripts` so tests can import the script modules (see findings). |
| `templates/nest/src/core/logger/logger.options.ts` (+ spec)     | `/health` prefix match replaced by `/^\/health(\/|$)/` on the query-stripped pathname; spec gains `/health`, `/health?verbose=1`, `/healthy-users`, `/healthcare` and no-url cases. |

## Pins that moved, and why

`node scripts/pin-node-preset.mjs` (2026-11-13, 01:00 ICT):

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/testing`: `^12.5.0` →
  `^12.4.2`. 12.5.0 was published 2026-11-12 and was still inside the one-day
  `minimumReleaseAge` window; the script stepped each to the newest stable older than one day.
  A caret on 12.4.2 still resolves an aged 12.x if 12.5.0 crosses the window before a generated
  project installs. The exact node-preset pins did **not** move (prettier latest 3.10.1 and
  typescript latest 7.0.2 were both too new and stepped down to the already-pinned versions).
- `rxjs` manifest caret corrected `^7.8.1` → `^7.8.2` (the version phase 1 actually resolved).
- `supertest` `^7.0.0` → `^7.3.2`, `@types/express` `^5.0.0` → `^5.0.6`, `@types/supertest`
  `^7.0.0` → `^7.2.1`, `@vitest/coverage-v8` `^4.1.2` → `^5.1.0`, `vite` `^8.0.0` → `^8.3.8`,
  `vitest` `^4.1.2` → `^5.1.0` — the template manifest had loose carets from `nest new`; the pin
  script now owns them.
- `vitest`, `vite`, `@vitest/coverage-v8` joined the Nest pin lists: the node preset's generated
  manifest has no vitest stack today, so these are Nest-specific, not shared toolchain.
- Idempotency: a rerun reproduces byte-identical outputs (sha256 over both outputs identical
  across runs). `git diff --exit-code src/commands/init/constants/node-preset-dependency.constant.ts`
  is clean — no existing pin moved.

## Bundle size

|                | Bytes   |
| -------------- | ------- |
| Before (HEAD)  | 344,709 |
| After          | 344,709 |

No growth yet: `NEST_TEMPLATE_FILES` has no consumer inside `src/cli.ts` until phase 3 wires
init, so tree-shaking drops it. The embed is proven by `tests/nest-template.test.ts` (vitest
receives the same define the bundle gets) and `tests/bundle.test.ts` still runs `dist/cli.mjs`
with no `node_modules`. Expect the phase 3 build to grow by roughly the template's 116 kB.

## Scratch re-proof (pnpm 11.24.0, pins after the move)

Fresh scratchpad copy of `templates/nest/` + toolchain files from `init scratch-node -y` donor +
19 shared devDependencies merged. `pnpm install` resolved **without adding any
`minimumReleaseAgeExclude` entry** to `pnpm-workspace.yaml` (the only entries written were the
esbuild build-approval placeholder, replaced with `allowBuilds: esbuild: true`).

| Check           | Result                          |
| --------------- | ------------------------------- |
| install         | exit 0                          |
| lint            | exit 0                          |
| typecheck       | exit 0                          |
| test            | 8 passed                        |
| test:e2e        | 7 passed                        |
| build           | exit 0                          |
| prettier --check| clean                           |
| GET /health/ready | 200                           |
| GET /healthy-users | 404 and **logged** (the fix) |

Serve log: the authorization header logged as `[Redacted]`, incoming `x-request-id: proof-req-42` reused as
`req.id`, zero request-log entries for `/health/ready`, server killed, port confirmed free.

## Findings

1. **Vitest/tsdown `define` parses JSON into an object literal.** `__NEST_TEMPLATE__` defined as
   a JSON *string* arrived in test code as an already-parsed object (`JSON.parse` then choked on
   `[object Object]`). The repo's own convention was the answer: `__JSS_PACKAGE__` declares the
   object type and consumes it directly, so the nest constant does the same. `__HARNESS_HOOK_BUNDLE__`
   stays a string because the JSON of a text blob is a valid string literal.
2. **ESLint `no-restricted-imports` negation is gitignore-strict.** `['../*', '!../scripts/**']`
   and `!../scripts/*` still ban `../scripts/x.mjs` (a parent "directory" match cannot be
   re-included); only `!../scripts` works. Probed empirically against the repo's ESLint before
   landing the rule change.
3. **`execFileSync` failure objects**: the exit status lives on `error.status` (number),
   `error.code` is a signal/errno string or undefined — the first `git check-ignore` handling
   keyed on the wrong one.
4. **The `@nestjs/i18n` 0.0.3 catalog layout, DI value-imports and the `^12.1.0` peer** from
   phase 1 all held on the moved pins; nothing under `src/core/i18n` needed touching.

## Checks (repository)

- `pnpm lint` → exit 0
- `pnpm typecheck` → exit 0
- `pnpm test` → 32 files passed, 2 skipped; **502 passed, 11 skipped** (was 498; +4 from
  `nest-template.test.ts` and the logger spec is template-side, not repo-side)
- `pnpm build` → exit 0; `dist/cli.mjs` 344,709 bytes
- `node scripts/pin-node-preset.mjs` twice → identical hashes both outputs

## Unresolved questions

- None blocking. Phase 3 inherits: the embed grows `dist/cli.mjs` on first real use, and
  `eslint.config.mjs` now allows `../scripts` imports from tests (pattern `['../*', '!../scripts']`).
