# Recapture the site hero transcripts against the current CLI

Date: 2026-11-12 · Branch: `main` · Mode: cook (no plan)

## Outcome

`site/src/constants/transcripts.constant.ts` now matches real runs of the built CLI
(`dist/cli.mjs`, `pnpm build` first). Captures followed the
`capture-cli-transcript` learned skill exactly: `FORCE_COLOR=1` for non-interactive
commands, a `script` pty run at `cols 100 rows 50` replayed through
`@xterm/headless@5.5.0` for the interactive init, and a hand onboarding per
`.harness/BOOTSTRAP.md` for the onboarded `harness doctor`.

## What drifted and was recaptured

| Transcript        | Drift found in a real run                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `INIT_TRANSCRIPT` | The dry-run file list changed (new `.claude/skills/harness-*`, `.harness/bin/hooks.mjs`, `.harness/core/base/**` entries), and the run now ends with an `Assumed npm for this plan; pass --pm to pick another` line and a `To apply:` block. Count still `51 to create`. |
| `INIT_RUN_TRANSCRIPT` | Same file-list change, install time now `12.1s`, and the new post-install task prints `◇ Formatted 43 files` between `Sorted package.json` and `└ Next steps` — the drift this task was opened for. |
| `HARNESS_ONBOARDED_TRANSCRIPT` | Re-onboarded a fresh `my-app` with sample answers (three memory lines, one decision); the real numbers are `735/9600 chars, 8 entries, Decisions 1` (was `833`). The old number was an artifact of the previous sample answers. |

## What did not change

- `DOCTOR_TRANSCRIPT` — byte-identical to a fresh `doctor` capture (same tool versions).
- `HARNESS_TRANSCRIPT` — byte-identical to `harness doctor` in a fresh `my-app` (`488/9600 chars, 5 entries, Decisions 0`).
- `INSTALL_TRANSCRIPT` — not a CLI run; it quotes the installer, and its versioned-home line still says `0.1.0`, which matches `package.json`.

## Method notes

- The curated file-list sample keeps the same nine entries the old constant showed; all nine still exist in the new runs, verified line-exact against the captures.
- The replayed screen's line endings carry xterm's own reset codes (some lines lack the trailing `\u001b[0m` the old constant had); lines were pasted as captured, no hand-edited escape codes.
- Every constant line was verified against the capture files programmatically: the three recaptured arrays are exact lines of the new runs, the two doctor transcripts byte-equal their captures.

## Verification (real output)

- `pnpm --dir site lint` — passed.
- `pnpm --dir site typecheck` — passed.
- `pnpm --dir site test` — 26 files, 123/123 passed.
- `pnpm --dir site build` — built in 393ms.
- `pnpm lint` — passed.
- Not checked: a browser render of the hero tab (the site test prints every transcript line through the Terminal component with codes stripped, which covers content; colour parity follows from the codes being pasted verbatim).

## Scope

No commit, no push (as instructed). The change touches the one constant file; docs pages and `Home.constant.ts` consume the constants unchanged.
