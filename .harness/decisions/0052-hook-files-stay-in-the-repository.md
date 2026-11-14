---
id: 0052
title: The hook files stay in the repository, and harness doctor checks them against the CLI
status: Accepted
date: 2026-11-14
supersedes: none
---

# 0052: The hook files stay in the repository, and harness doctor checks them against the CLI

## Context

The hooks could run from the installed CLI instead of the repository. That was dropped: a clone
must work without the CLI installed, and with the CLI-owned copy each machine would run its own
hook version, drifting from what the repository's tests and reviews see.

## Decision

- `.harness/bin/hooks.mjs` and `.harness/bin/harness-hook.mjs` stay tracked in the repository.
- `harness doctor` compares both files byte-for-byte with the copies inside the running CLI at the
  same manifest version, and reports an error naming the file when they differ. At a different
  version the row reads "not verified" and is a warning, never `ok`.
- `harness update` at the same version restores an edited hook file instead of merging it.
- A pull request that touches `.harness/bin/`, `.harness/core/` or the hook entries of
  `.claude/settings.json` from outside is refused; a maintainer runs `jss-devtools harness update`.
  On GitHub, limiting pull requests to collaborators removes the case.
- The bundle is not minified, despite [0032](./0032-harness-update.md) saying the release
  is; the hook bundle is readable so a reviewer can read what will run.
- Extends [0031](./0031-init-installs-the-harness.md) (hooks wired into Claude Code),
  [0032](./0032-harness-update.md) (the bundle), and
  [0033](./0033-harness-doctor.md) (doctor checks the repository).

> "tôi đang lo sợ về việc client muốn dùng harness mà ngại việc install jss-devtools" (user,
> 2026-11-13); on outside pull requests: "Không nhận PR từ open / hoặc review kỹ là đc đúng
> không." (user, 2026-11-13)

## Options considered

| Option                                                | Consequence                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Hook files in the repository, checked against the CLI | A clone works standalone; drift is caught by doctor and fixed by update |
| Hooks run from the installed CLI                      | No drift, but a clone breaks without the CLI and machines drift apart   |

## Consequences

- Easier: a clone runs the hooks with nothing installed; review sees the exact hook text.
- Harder: an edit to `.harness/bin/` survives until `harness update` restores it; an old install
  shows the expected Hook files error until its first `harness update` on this CLI.
- Enforced by: `harness doctor` (exit 1 on mismatch), the same-version restore in `harness update`,
  and review.
