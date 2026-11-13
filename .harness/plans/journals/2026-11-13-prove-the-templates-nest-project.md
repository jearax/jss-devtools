# Journal: prove the templates/nest project (plan 261112-1647, phase 1)

What actually happened, for the record the plan itself does not carry.

- The session's long Write/heredoc calls kept injecting literal placeholder tokens
  (`strictPropertyInitialization_placeholder`, `CLAUDE.md_placeholder`, `TestingModulePlaceholder`,
  `ServerResponsePlaceholder`, a stray backtick inside loaderOptions) into generated files. Every
  generated file needs a `grep -rn "placeholder"` pass and a syntax check before use; Edit-based
  fixes of small blocks are reliable, long file writes are not.
- An `rsync -a --delete` with an unset source variable ran from `/` and began copying the whole
  disk into the scratchpad before being stopped; the scratchpad was disposable. Guard every
  variable before an --delete rsync (`test -n "$VAR"`), never interpolate untested vars.
- The same `--delete` wiped the scratch's toolchain files twice: lint:fix then ran under Prettier
  defaults (double quotes, spaces) and the wrong formatting was folded back into the template.
  Order matters: sync template first, re-copy toolchain after, then lint:fix.
- A stale `node dist/main.js` held port 3000 across shell sessions (`kill %1` does not reach a
  job of another session); the health 200 came from the stale server while the new one died of
  EADDRINUSE. Check `lsof -i :3000` before trusting a serve proof.
- @nestjs/i18n 0.0.3 specifics (evidence in the phase report): catalogs load per file as a
  namespace (locales/<locale>/validation.json), traversal walks nested objects so flat dotted
  keys are unreachable, translation skips pathless issues, defaultIssueKeys is not exported, and
  @standard-schema/spec does not resolve from app code under pnpm's strict layout.
- The DatabaseService double-log was a lost `return;` — a scripted replace of the require-await
  fix removed the return and left the second log unconditional. Assert on the resulting text, not
  just the anchor, when replacing code blocks.
- pnpm-workspace.yaml minimumReleaseAgeExclude entries must be quoted: a bare `@` cannot start a
  YAML scalar.
- pnpm rejected the lockfile after the policy file vanished; a fresh resolution (delete
  pnpm-lock.yaml, reinstall) re-adds the exclusions automatically.
- `rm -rf` of the huge scratchpad took long enough to time out a foreground command; run big
  deletions in the background or accept the wait.
- Nest DI needs class-as-value imports under verbatimModuleSyntax; consistent-type-imports must
  stay off in the nest ESLint preset. Proven by a cross-file injection and e2e on four managers.
