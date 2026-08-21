# Phase-02 Finalize Decision: GO

**Date**: 2026-08-21
**Status**: ✅ GO — Finalize and commit
**Phase**: 02 - Detector Split + PM Ledger Store

## TL;DR

**GO — Finalize and commit.** Phase-02 is complete and verified. All plan requirements implemented, quality gates green, graceful degradation working (kongming gate #2 satisfied), parallel probe operational, and PM ledger integrated in uninstall. No blockers for finalize.

## Reframed Problem

Phase-02 aimed to solve three core problems:
1. **Performance + Correctness**: Replace serial PM probe (cache-PM-and-trust) with parallel probe to eliminate stale detection risk
2. **Persistence**: Build PM ledger to track which PMs have EVER installed the CLI globally — warn about leftover copies during uninstall
3. **Robustness**: Ensure CLI works in read-only environments (CI, Docker) via graceful degradation when config writes fail

The implementation delivers all three without scope creep.

## What to Do

### 1. Commit Phase-02 (immediate)

**Commit message structure**:
```bash
git add .
git commit -m "feat(phase-02): detector split + parallel probe + pm ledger store

- Extract pm.ts (PM_DISPLAY_NAMES, PROBE_ORDER) from global-pm.ts
- Parallel probe: Promise.all over 4 PMs, rank by priority, return all matches
- Add conf@15.1.0 store with graceful degradation (EACCES/EROFS → stateless mode)
- PM ledger: recordPmSeen(winner) on detection, uninstall reads for previous-PMs warning
- Shadowing warn: multiple current installs detected → confirm prompt shows all copies
- Tests: 22/22 passing (detector parallel probe + store round-trip + graceful degradation)
- Quality gates: lint ✅ typecheck ✅ build ✅"
```

**Files modified** (15 changed, 413 insertions, 74 deletions):
- New: `src/core/detector/pm.ts`, `src/core/store/index.ts`
- New tests: `tests/detector.test.ts`, `tests/store.test.ts`, `tests/prompts.test.ts`
- Modified: `src/core/detector/global-pm.ts`, `src/commands/self/uninstall.ts`, `package.json`, plus phase-01 cleanups

### 2. Update Plan Status

Update `/Users/tandm/Documents/jearax/npm/jss-devtools/plans/260821-1050-uninstall-command-design/phase-02-detector-split-pm-ledger-store.md`:

```markdown
---
status: done
finishedAt: 2026-08-21
---
```

### 3. Phase-03 Handoff Preparation

**What's ready for Phase-03**:
- `pm.ts` shared constants are second-consumer-ready (eslint/prettier detectors will import)
- Store module extensible: `getPmOverride`/`setPmOverride` helpers already implemented
- Detector pattern established: lockfile-based (Phase 03) vs subprocess probe (global) cleanly separated

**What Phase-03 should NOT touch**:
- `global-pm.ts` parallel probe logic — stable and working
- Store graceful degradation — tested and production-ready
- Core detector types — `DetectedPM` interface is load-bearing

### 4. Verify Before Commit

**Final smoke check** (optional but recommended):
```bash
# Manual smoke - uninstall with --dry-run to see ledger warnings
node dist/cli/cli.js uninstall --dry-run --json

# Verify conf file location (debug log shows storePath)
# Should create: ~/.config/jss-devtools/config.json (Linux) or ~/Library/Preferences/jss-devtools/config.json (macOS)
```

## What to Avoid

### 1. **Don't split the commit**
Phase-02 is logically cohesive (detector + store + uninstall integration). Splitting into "detector changes" then "store changes" breaks atomicity. The parallel probe and store were designed together — keep them together.

### 2. **Don't pre-emptively optimize the store**
The conf single-file design is correct for the ledger's workload (KB-scale, ~5 PM entries max). Don't add pruning logic, XDG config/cache split, or migration complexity until update-notifier state grows in Phase-04. (See previous kongming report: " ledger growth is negligible" — HIGH confidence.)

### 3. **Don't refactor module imports in Phase-03**
`pm.ts` was extracted specifically to be the shared constants module. Phase-03 eslint/prettier detectors should import from `@/core/detector/pm`, not create their own constants or re-import from `global-pm.ts`. The module graph is clean — keep it that way.

### 4. **Don't skip graceful degradation testing**
If you add more store operations in future phases, always test the EACCES stateless path. The pattern is proven: `try { new Conf() } catch (EACCES/EROFS) { null store }`. Reuse it.

## Alternatives & Trade-offs

### Alternative 1: Phase-02 commit includes Phase-01 cleanups
**Current state**: The diff includes phase-01 refactor cleanups (confirmOrCancel, status schema, etc.) already committed earlier.
**Trade-off**: Keeping them in one commit creates a larger "Phase 01+02 combined" historical artifact.
**Recommendation**: **Accept as-is**. The cleanups are foundational to Phase-02 (especially `destructive` option for uninstall confirmation). Splitting them now would require interactive rebase — not worth the complexity risk.

### Alternative 2: Store migration to XDG cache/config split now
**Rejected correctly**: Single store with namespaced keys works for Phase-02. The ledger is tiny and semi-persistent. Split when update-notifier state grows (Phase-04). See previous kongming report: "XGD config/cache split deferral is sound" — HIGH confidence.

### Alternative 3: Add timing benchmarks to commit message
**Trade-off**: Mentioning "251ms total (80ms node → 170ms probes, 301% CPU)" in commit message is precise but implementation-detail-heavy.
**Recommendation**: **Skip timing details in commit message**. Keep commit message focused on behavior change (serial → parallel). Performance is a success metric, not a contract. Timing data lives in tests/plan reports, not git history.

## Work Checklist

### For Finalize (immediate)
- [ ] Update plan status to `done` with `finishedAt: 2026-08-21`
- [ ] Commit all changes with conventional message (see "What to Do" section)
- [ ] Verify commit hash and close phase-02

### For Phase-03 Scaffold (next)
- [ ] eslint/prettier detectors import from `@/core/detector/pm` (not duplicate constants)
- [ ] Lockfile-based detection via `package-manager-detector` lib (no subprocess)
- [ ] Update plan to track second consumer of `pm.ts` shared constants
- [ ] Keep store operations graceful-degradation-aware (null-safe helpers)

### For Phase-04 Polish (future)
- [ ] Monitor `pmLedger` size for growth (unlikely to exceed 5 PMs)
- [ ] Consider XGD split when update-notifier state grows (release notes, version history)
- [ ] Add cache-clearing command if users request it

## Success Metrics

### Phase-02 Delivery (verified ✅)
- [x] **Zero false-positive uninstalls**: Parallel probe eliminates stale cache risk
- [x] **Graceful CI compatibility**: EACCES/EROFS → stateless mode, CLI functions without throwing
- [x] **PM switch detection**: Ledger tracks history, uninstall warns about previous PMs
- [x] **Performance acceptable**: Parallel probe ~251ms measured (well under 1s threshold)
- [x] **Quality gates green**: lint ✅ typecheck ✅ build ✅ 22/22 tests ✅

### Post-Finalize (monitor)
- [ ] No user reports of CLI crashes in CI/read-only environments
- [ ] No reports of uninstall targeting wrong PM copy
- [ ] Conf file location works across platforms (verify via user reports)

## Assumptions

| Assumption | Confidence | What Would Change Answer |
|------------|-----------|--------------------------|
| Parallel probe ~251ms is acceptable for explicit CLI invocations | HIGH | If users complain about slow startup, consider caching with TTL (but this defeats stale-state elimination) |
| conf single-file store is acceptable long-term for ledger semantics | HIGH | If `pmsSeen` grows beyond ~10 PMs or update-notifier state becomes large, add XDG split in Phase-04 |
| Phase-03 will consume `pm.ts` constants without refactoring module structure | HIGH | If Phase-03 requires detector hierarchy changes, reassess module boundaries (but current plan shows lockfile-based, not subprocess) |
| Graceful degradation covers all read-only HOME scenarios | MEDIUM | If new error codes emerge (ENOSPC, EISDIR), extend catch block — pattern is extensible |
| Uninstall ledger warning UX is clear enough | MEDIUM | If users misinterpret "previously installed via X" as "X still installed", refine message wording |

## Unresolved Questions

### Question 1: Is conf single-file store acceptable long-term for ledger's 'history' semantics?

**Answer**: YES — conf single-file design is correct for Phase-02 and acceptable long-term.

**Why**:
- Ledger is tiny: max ~5 PM entries (pnpm, npm, yarn, bun, deno) — KB-scale
- Write pattern is low-frequency: only on successful global detection (not per-invocation)
- conf handles atomic writes, so concurrent process risk is minimal (CLI is single-user, single-invocation)
- Namespaced keys (`pmLedger`, future `pm`, `updateCheck`) keep concerns separated within one file

**When to revisit**:
- If `pmsSeen` grows beyond 10 PMs (unlikely unless PM ecosystem explodes)
- If update-notifier state in Phase-04 grows large (release notes, version history) → migrate to separate cache store per previous kongming report
- If users request cache-clearing functionality → add `jss-devtools cache clear` command

**Evidence**: Previous kongming report explicitly states "ledger growth is negligible" (HIGH confidence). XDG config/cache split deferral is sound until data justifies it.

### Question 2: Anything to watch at commit time or Phase-03 handoff?

**At commit time**:
- Ensure commit message includes graceful degradation mention (kongming gate #2 was REQUIRED)
- Don't split phase-01 cleanups into separate commit — keep atomicity
- Verify `package.json` has `conf: ^15.1.0` dependency

**At Phase-03 handoff**:
- `pm.ts` shared constants are load-bearing — eslint/prettier detectors must import, not duplicate
- Store module is stable — don't refactor graceful degradation logic
- Detector split is intentional: global-pm.ts (subprocess probe) vs future lockfile-based detectors (Phase 03)

---

**Final Recommendation**: GO — finalize and commit immediately. Phase-02 is complete, verified, and ready for Phase-03 scaffold. No blockers, no scope creep, all success criteria met.

**Implementation Quality**: A-tier. Parallel probe eliminates stale-state risk, graceful degradation covers CI/read-only edge cases, and PM ledger provides history context without trusting stale data for destructive operations. This is exactly the design approved in the previous kongming gate.
