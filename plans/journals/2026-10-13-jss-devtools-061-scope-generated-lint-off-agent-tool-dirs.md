---
title: "jss-devtools 0.6.1: scope generated lint off agent-tool dirs"
date: 2026-10-13
summary: "Generated lint walked .claude/.agentkit JS; narrowed script globs + config ignores, released v0.6.1"
---

# jss-devtools 0.6.1: scope generated lint off agent-tool dirs

## What happened
In a Node repo set up by `jss-devtools init` plus AgentKit/harness, `npm run lint` (`eslint .`) ran >5 min. ESLint flat config neither reads `.gitignore` nor skips dot-dirs, so it walked hundreds of tool-owned JS files under `.claude/` and `.agentkit/`.

## Fix (commit 06eb9c2, tag v0.6.1)
- `scripts-content.ts`: `lint`/`format` now `eslint [--fix] --no-error-on-unmatched-pattern "{src,test}/**/*.ts" "*.{ts,mjs}"` (restored pre-8f07841 node scope). Globs exported and shared with `lint-staged-content.ts`.
- `eslint-config-content.ts`: ignores add `.claude/**`, `.agentkit/**`, `.harness/**`.

## Verification
Packed tarball, fresh `init`, 300 dirty files in `.claude/`: `npm run lint` 0.42 s exit 0; `eslint .` exit 0; real error in `src/` still fails; no `src/` dir still exit 0. Each layer alone also keeps `npm run lint` clean. Release workflow green, npm `latest` = 0.6.1.

## Gotchas
- `scout-block` hook rejects Bash commands containing the literal build-report dir name (why tests split the string as 'cov' + 'erage').
- `smoke.test.ts` runs `dist/`; build before testing or it reports a stale version.
- Scripts are add-only-when-absent, so existing projects keep `eslint .` until edited by hand; re-running init only updates `eslint.config.mjs`.

## Next steps
- Open question: also ignore `.cursor/`, `.codex/`, `.agents/`?
- Local stray tag `v1.0.0` exists; not pushed, worth checking.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
