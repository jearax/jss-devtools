---
id: 0044
title: The version moves to 0.1.0 for the first feature release
status: Accepted
date: 2026-11-10
supersedes: 0020
---

# 0044 The version moves to 0.1.0 for the first feature release

## Context

[0020](./0020-version-0-0-1-during-development.md) held the version at `0.0.1` while the rewrite was
developed and tested, and said the number moves when the first real release is cut. The rewrite now
ships the features the landing site shows: `init`, the harness onboarding and the site itself.

## Decision

`package.json` carries `0.1.0`, and every place the product states the version says the same. The
site reads it from the package facts at build time, so it is stated once.

The deploy trigger does not change: a green push to `main` deploys, and the image tag
`sha-<full commit SHA>` is what a rollback points at ([0019](./0019-artifact-lives-in-the-site-image.md)).
The repository has no release tags yet, so nothing tags this version.

> "bump version 0.0.1 → 0.1.0 mọi chỗ product version xuất hiện" (user, 2026-11-10)

## Options considered

| Option                   | Consequence                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| Move to `0.1.0` now      | The version matches what the product does; the site says it      |
| Keep `0.0.1` until a tag | The site would keep claiming a version the release does not have |
| Move to `1.0.0`          | Claims stability the rewrite has not proven yet                  |

## Consequences

- Easier: the site's eyebrow, the installer transcript and the harness doctor transcript all state
  `0.1.0`, and they state it from one source.
- Harder: the install path stays `/releases/latest`, so an old install keeps the version it fetched.
  A versioned path and a tag per release are still open work.
- Enforced by: review only; the version lives in `package.json` and is injected at build.
