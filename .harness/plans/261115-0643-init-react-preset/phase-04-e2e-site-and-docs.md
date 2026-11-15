---
phase: 4
title: "End-to-end proof, site and docs"
status: done
priority: P1
effort: "1.5d"
dependencies: [3]
---

# Phase 4: End-to-end proof, site and docs

## Goal

A generated React app, single and monorepo, works end to end with each package manager, and the
help, the site and the docs describe the preset the way they describe nest.

## Files

- Create: `tests/init-react.e2e.test.ts`, gated by `INIT_E2E=1`, reusing `tests/support/init-e2e.ts`
  and modelled on `tests/init-nest.e2e.test.ts`.
- Site, modelled file by file on the nest page:
  - Create: `site/src/pages/Docs/pages/React/` (the page, its constants, its sections, its test).
  - Modify: `site/src/constants/routes.constant.ts`, `reference.constant.ts` (the `--framework`
    text names `react` as working), `search-index.constant.ts`,
    `site/src/pages/Docs/Docs.constant.ts`, `Docs.route.ts`, and the init page under
    `site/src/pages/Docs/pages/Init/` (a react section beside the nest one, in its own file).
  - Create: `tests/site-react-docs.test.ts`, modelled on `tests/site-nest-docs.test.ts`: the page's
    scripts block, `src` tree and environment table stay equal to the template.
  - Modify: `ci/smoke-site-image.sh` — `/docs/react` answers 200.
- Docs:
  - Modify: `README.md`, `.harness/docs/system-architecture.md`, `.harness/docs/codebase-summary.md`,
    `.harness/docs/project-roadmap.md` (react is built; `rn` and `next` remain),
    `.harness/docs/project-overview-pdr.md` if it lists the presets.
  - Modify: `.harness/docs/react-template-traps.md` (it exists, with its README row and its memory
    pointer): add the traps phases 2 to 4 actually hit. New React traps go there, not into
    `.harness/MEMORY.md`.
  - Modify: `CLAUDE.md` outside the harness block — the "Where things are" row for `templates/`.
  - Modify: `.claude/skills/verify-init-template/SKILL.md` — the react checks and serve proof.

## Steps

0. Title substitution in `react-plan.service.ts`: the project name is a folder name and may hold
   `$`, `&`, `<` or `>`. Escape it for HTML and substitute through a replacer function, with a unit
   test for a name such as `a&b$&c`.
1. E2E per manager on `PATH`: `init my-react-<pm> --framework react --pm <pm> -y`; `lint`,
   `typecheck`, `build`; the React Compiler marker in `dist/assets/`; `vite preview` on a free
   port, `GET /` and `GET /dashboard` 200 with HTML; stop the process; `prettier --check .`; no git
   commit in the generated project. The same for `--monorepo --framework react` through turbo.
2. Site page: what the preset writes, the scripts, the `src` tree, the environment variables, the
   conventions (zustand for state, `use` instead of `useContext`, feature flags through
   OpenFeature), and what is not there yet (the sample, tests, Tailwind). Follow decision 0042 and
   the site conventions under `.harness/docs/site/`.
3. Docs. Every claim is checked against the code; no placeholder text.

## Verification

- `pnpm build && INIT_E2E=1 pnpm vitest run tests/init-react.e2e.test.ts tests/init-nest.e2e.test.ts tests/init.e2e.test.ts tests/init-monorepo.e2e.test.ts`
  — the real output per manager, skipped managers named.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`
- `jss-devtools harness doctor` reports a healthy harness.

## Notes

- A push to `main` deploys the site; this plan does not push and does not commit. The decision, the
  reports, the plan and the work are committed together by the user.
- Deferred, recorded in decision 0057: the sample tied to `--no-sample`, tests in the generated
  app, and Tailwind.
