# Deployment Guide — `jss-devtools`

Distribution model: **public npm package** + **public GitHub repo**.

## npm Package

- Name: `jss-devtools`
- Bin: `jss-devtools`
- Registry: `registry.npmjs.org` (default public)
- Access: public

## Release Flow (current — tag-based, NOT changesets)

We use a direct git-tag-push flow. No bot PRs, no manual merge step, no first-time approval gate.

### Local workflow

```bash
# 1. Make sure tests/lint/typecheck pass + dist is current
pnpm test
pnpm lint
pnpm typecheck
pnpm build

# 2. Bump version + create annotated tag in one step
pnpm version patch     # or: minor / major
# → updates package.json, commits "vX.Y.Z" + creates git tag vX.Y.Z

# 3. Push the commit AND the tag
git push --follow-tags
# → tag push triggers .github/workflows/release.yml
```

### What CI does on tag push

`.github/workflows/release.yml` runs (trigger: `push: tags: ['v*']`):

1. Lint → Typecheck → Test → Build
2. `pnpm publish --no-git-checks` (uses `NPM_TOKEN` repo secret)

Tag push triggers **only** `release.yml`. PR and main pushes trigger **only** `ci.yml` — no overlap.

### Why we left changesets

Old flow (changesets + bot) required:
1. Bot opens a PR "Version Packages"
2. GitHub first-time approval gate (`action_required`) on every bot PR
3. Manual merge step (repo has `allow_auto_merge: false`)
4. Then changesets bot publishes

→ 2 manual steps per release. Tag-based flow: 0 manual steps after `git push --follow-tags`.

Trade-offs we accept:
- No auto-generated `CHANGELOG.md` — author writes the version notes into the commit message or PR description
- No PR-based changelog review — release is fire-and-forget

### What was removed in this refactor

- `.changeset/` folder (was 2 pending changesets: `init-prettier-tabwidth-4.md`, `init-commitlint-ticket-or-conventional.md` — folded into next manual release's CHANGELOG)
- `package.json` `"version"` script (`changeset version`) — use `pnpm version <bump>` directly
- `package.json` `"release"` script — now `pnpm clean && pnpm build && pnpm publish --no-git-checks`
- `@changesets/cli` from `devDependencies`
- `.github/workflows/release.yml` — `changesets/action@v1` step removed; `environment: main` removed

## Pre-publish Checklist

- [ ] `engines.node` set to `>=24.0.0`
- [ ] `bin` field in `package.json` points to compiled entry
- [ ] `files` field restricts what gets shipped (no `src/`, no `tests/`, no `docs/`)
- [ ] `LICENSE` file present
- [ ] README rendered correctly on npm page
- [ ] `npm pack --dry-run` output reviewed
- [ ] Version tag follows semver
- [ ] `CHANGELOG.md` updated for the new version (manual, since no auto-generation)
- [ ] `package.json` version bumped by `pnpm version` (creates tag)
- [ ] Tag pushed via `git push --follow-tags`

## Versioning

- SemVer: `MAJOR.MINOR.PATCH`
- Pre-release tags: `1.0.0-rc.1`, etc.
- Initial release target: `0.1.0` (MVP usable but pre-stable)
- Tag format: `vX.Y.Z` (must match pattern for release.yml trigger)

## CI Workflows (current)

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | `push: [main]` + `pull_request: [main]` | Lint + Typecheck + Test + Build (validation only) |
| `.github/workflows/release.yml` | `push: tags: ['v*']` | Same validation + `pnpm publish` |

Each push triggers exactly one workflow. `ci.yml` covers branches and PRs; `release.yml` covers tags.

## Required GitHub Secrets

- `NPM_TOKEN` — npm automation token with publish scope; referenced by `release.yml` as `NODE_AUTH_TOKEN`

Repo-level: `allow_auto_merge` stays `false` (irrelevant for tag-based flow; would matter only if we kept the changesets bot PRs).

## Local Install Test

```bash
# After first publish
npm i -g jss-devtools
jss-devtools --version
jss-devtools --help
```

## Open Decisions

- ~~Release tooling: changesets vs release-please~~ — **resolved**: tag-based manual, no bot
- CI runner: GitHub Actions (current) vs other
- Signing / provenance scope — currently no provenance flag; can add `--provenance` to `pnpm publish` for npm OIDC attestations later
