# Manual Campaign — node mode

Date: 2026-08-31 | Mode: node | Status: PASS

## Steps performed
1. Fresh scratch dir `/var/folders/.../init-node-XXXX.ZHpPRzxm9f`
2. `printf 'package.json' (private:true, type:module, empty scripts)` → scratch
3. `jss-devtools init --framework node --yes` (no TTY, non-interactive)
4. `git init -b main` (existing repo detected → silent noop)
5. `git add -A && git commit -m "feat: initial commit"` (conventional) → lint-staged runs, commit ok
6. `echo // foo >> eslint.config.mjs && git add && git commit -m "no convention here"` (bad message) → commitlint blocks

## Artifacts (verified on disk)
- `eslint.config.mjs` (flat config, house preset)
- `.prettierrc.json` (tabs, semi:false, singleQuote, etc.)
- `commitlint.config.mjs` (`extends: ['@commitlint/config-conventional']`)
- `.gitignore` (node_modules, dist, coverage, etc.)
- `tsconfig.json` (ES2022, paths '@/*' → ./src/*, strict)
- `.husky/pre-commit` (`#!/usr/bin/env sh\nnpx lint-staged`)
- `.husky/commit-msg` (`#!/usr/bin/env sh\nnpx commitlint --edit "$1"`)
- Both hooks: `0o755` exec bit ✓
- `package.json`: scripts `prepare` + `format`, lint-staged config
- 18 devDeps installed, 0 vulnerabilities

## Bugs found and fixed during this campaign
1. **Peer picker legacy stream bias** (kongming-confirmed concern):
   `@typescript-eslint/parser@1.x` peer `eslint: ">=4.19.1"` accidentally satisfies eslint@10 anchor, picking the 1.x legacy runtime instead of 8.x ecosystem-current. Fix: cap picker to `currentMajor` (major of newest stable).
2. **typescript anchor over-newest**: typescript 7.x real, but `@typescript-eslint/parser@8.x` peer `<6.1.0`. Without anchoring typescript to a safe major, install always failed. Fix: `ANCHOR_MAX_MAJOR` table; typescript capped to 5.x.
3. **Missing .gitignore**: a fresh `git init` + `git add .` swept node_modules into the index, and lint-staged OOMed the first pre-commit run. Fix: generate `.gitignore` whenever missing (only — never overwrite user rules).

## Hook behavior verified
- Conventional message: `git commit -m "feat: initial commit"` → lint-staged runs, commit ok
- Non-conventional message: `git commit -m "no convention"` → commitlint emits `subject may not be empty` + `type may not be empty`, `husky - commit-msg script failed (code 1)` blocks commit

## Carry-forward
- react + next campaigns not yet run (require same session — both rely on the picker + gitignore fixes already in main)
- `.npmrc` `strict-peer-dependencies=true` still inherits from repo; this amplified the picker failure mode into a hard ERESOLVE