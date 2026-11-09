# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when there is one: `(src: path:line)`.
- Longer than a line: write `.harness/docs/<topic>.md` and leave
  `- <fact>. See .harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.
- Both `.harness/bin/*.mjs` and `.harness/core/base/` are written by `harness update` from the CLI's own bundle (source: `src/modules/harness/`); edit neither by hand. `core/base` is the three-way-merge base, not the bundle's source. (src: src/modules/harness/constants/hook-bundle.constant.ts)
- Existing-mode `init` rejects `--pm` by design: an existing project uses the manager `packageManager` declares. (src: .harness/decisions/0030-init-node-preset.md)
- `pnpm test` builds the bundle first through a vitest globalSetup, so a green test run also proves the build. (src: .harness/docs/system-architecture.md)
- The architecture rules are enforced by tests in `tests/support/architecture-rules.ts`, each with a negative fixture under `tests/fixtures/`; add rule and fixture together. (src: .harness/docs/code-standards.md)
- A long file written in one agent Write call can come out truncated or garbled mid-file while the tool still reports success; grep the file back for its expected tail before trusting it, and build long files with small heredoc appends instead.
- When pnpm hits an undecided build script it writes a literal placeholder `esbuild: set this to true or false` into `pnpm-workspace.yaml`; delete the placeholder line, never commit it. (src: .harness/plans/reports/cooker-261109-1635-dogfood-harness-migration.md)
- The doctor secret scanner flags any credential word followed by a colon or equals sign, even in prose or in reports quoting the scanner; reword instead of chasing a leak. (src: src/modules/harness/services/redaction.service.ts)
- The site's visual bar is product landing pages (harness.io, agentkit.best, claude.com/product/claude-code, herdr.dev); the user rejected a restrained, document-style landing as too plain. Reject "restraint" directions for site/ marketing pages.
- Site screenshots: clear a stale `jds-skin` cookie (it overrides the site skin), scroll to top and let the hero's typing finish; a full-page capture draws the sticky header mid-page. Check 390px overflow by `scrollWidth > clientWidth`, not by eye.
- Chrome MCP synthetic events do not set `:active`, so press-state screenshots need a Playwright script holding a real `mousedown` before the capture.
