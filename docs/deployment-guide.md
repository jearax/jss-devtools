# Deployment Guide — `jss-devtools`

Distribution model: **public npm package** + **public GitHub repo**.

## npm Package

- Name: `jss-devtools`
- Bin: `jss-devtools`
- Registry: `registry.npmjs.org` (default public)
- Access: public
- Provenance: enable npm provenance (OIDC) once CI is set up

## Publish Workflow (target)

1. Bump version in `package.json` via release tooling (changesets / release-please — TBD)
2. Build dist via chosen bundler
3. CI runs tests + lint + typecheck
4. CI publishes to npm with provenance on tag push
5. GitHub Release created automatically (if release-please)

## Pre-publish Checklist

- [ ] `engines.node` set to `>=24.0.0`
- [ ] `bin` field in `package.json` points to compiled entry
- [ ] `files` field restricts what gets shipped (no `src/`, no `tests/`, no `docs/`)
- [ ] `LICENSE` file present
- [ ] README rendered correctly on npm page
- [ ] `npm pack --dry-run` output reviewed
- [ ] Version tag follows semver

## Versioning

- SemVer: `MAJOR.MINOR.PATCH`
- Pre-release tags: `1.0.0-rc.1`, etc.
- Initial release target: `0.1.0` (MVP usable but pre-stable)

## CI (target — GitHub Actions assumed)

Workflow jobs:

| Job | Purpose |
|---|---|
| `lint` | ESLint (`pnpm lint`) |
| `typecheck` | `tsc --noEmit` |
| `test` | Vitest on Node 24 LTS |
| `build` | Produce dist artifacts |
| `publish` | `npm publish --provenance` on tag |
| `release` | Create GitHub Release (optional) |

## Local Install Test

```bash
# After first publish
npm i -g jss-devtools
jss-devtools --version
jss-devtools --help
```

## Open Decisions

- Release tooling: changesets vs release-please
- CI runner: GitHub Actions (assumed) vs other
- Signing / provenance scope