---
name: capture-cli-transcript
description: Capture the CLI's real, coloured output for the site's terminal transcripts in site/src/constants/transcripts.constant.ts. Use when a transcript must match a real run of jss-devtools (init, doctor, harness doctor), when the CLI's output or colours change, or when an interactive run must be recorded as the user's terminal would show it.
metadata:
  harness-origin: learned
  harness-pinned: 'false'
---

# Capture a CLI transcript

## When to use

- A transcript in `site/src/constants/transcripts.constant.ts` is stale or must come from a real run.
- A run is interactive (prompts, spinners, the install task log) and plain piping would lose or mangle it.

## Procedure

1. Build the CLI: `pnpm build`, so `dist/cli.mjs` is current.
2. Non-interactive commands (`doctor`, `harness doctor`, `init <dir> -y --dry-run`): run with colour forced
   and keep the raw codes: `FORCE_COLOR=1 node dist/cli.mjs doctor > out.ansi`.
3. Interactive commands run in a pseudo-terminal with a size, answering prompts with Enter, from a scratch folder:
   `(for i in $(seq 1 20); do sleep 4; printf '\r'; done) | env -u CI FORCE_COLOR=1 script -q run.tty sh -c 'stty cols 100 rows 50; node <repo>/dist/cli.mjs init my-app'`
4. Replay the recording to the final screen: install `@xterm/headless@5.5.0` in a scratch folder, then
   `node .claude/skills/capture-cli-transcript/scripts/render-tty.cjs run.tty <scratch folder>`; read `run.tty.screen`.
5. Paste lines into the constant with ESC written as `\u001b`; drop the startup banner and cut long file
   lists to a few lines, as the existing transcripts do, and say so in the constant's doc block.

## Pitfalls

- `init` refuses without a terminal ("Not a terminal") and with 0 columns or `CI` set: hence `script`,
  `stty cols` and `env -u CI`.
- `init` with no `<dir>` needs `package.json`, `tsconfig.json` and a git root, else it stops early.
- Never use the raw `.tty` text: it holds spinner frames and the install log that clack later erases.
- The emulated full `init` run showed one extra `│` between the confirm answer and `◆ Installed`, which
  plain clack does not print; check a real terminal before treating it as output.

## Verification

- `pnpm --dir site test` passes: the terminal test prints every transcript line, codes stripped.
- The rendered tab matches the `.screen` file colour for colour.
