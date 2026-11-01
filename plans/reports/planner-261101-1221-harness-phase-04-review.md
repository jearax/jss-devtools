# Review: harness phase 4, round 1

Reviewed: the working tree on `d1f51e2`, your report, your scratch install at `/tmp/scratch-h4`, and
a planner run in existing mode (a repository with its own `CLAUDE.md` and `.claude/settings.json`:
user text and hooks kept, block appended, existing-mode `BOOTSTRAP.md`, exit 0). Fix the findings in
the same working tree, rerun the full gate, and append a "Round 1 fixes" section to your done
report with real output. Do not commit, do not push. Comments: default zero.

1. **Every installed text file lacks its final newline.** The report says the templates are
   byte-identical to the drafts; they are not. `cmp` against `plans/261101-0204-init-harness/content/`
   differs for all 17 files, and appending one `\n` makes all of them equal except `config.json`
   (whitespace only, accepted). `.harness/.gitignore` ends `update/` with no newline; `MEMORY.md`
   shows "No newline at end of file". Make every template end with exactly one `\n`, so the
   installed files and the `core/base/**` copies match. Add a test: every text entry of the install
   plan ends with exactly one newline.

2. **Outro alignment.** The harness line prints flush left under "Next steps", above commands
   indented by five spaces. Render it in the same style as the other next-step lines.

3. **Run the new e2e cases.** The `INIT_E2E=1` harness cases were written but never run. Run at
   least the harness-related ones with npm (for example with `-t` filtering), including the stub
   `ak` `--agent-kit` case, and paste the output. Fix what fails.

Accepted as reported: 2-space `.claude/settings.json`, the parsed-value bundle assertion,
`settings.json` outside the manifest, hard stops that `-f` does not override, the `ak` hint text,
and the single help example.
