# Persistent Store Design Review Report

**TL;DR**: GO on the resolved design. The parallel probe + `conf` approach is sound, ecosystem-aligned, and avoids the stale-state risks of caching. The XDG config/cache split deferral is acceptable for Phase 01. Implement with graceful degradation for read-only HOME and CI environments.

## Reframed Problem

The CLI needs to track which package managers (PMs) have EVER installed it globally to detect leftover copies when users switch PMs (e.g., npm → pnpm). The solution must:

- **Requirements**: Cross-platform config following Linux conventions (~/.config), history of all PMs used, no stale detection state for destructive operations
- **Constraints**: Learning repo (not production), unpublishing CLI, user wants to learn from ecosystem patterns, not reinvent
- **Goals**: Zero stale risk in uninstall, ecosystem-standard storage pattern, extensibility for future features (user override, update-notifier state)
- **Non-goals**: Perfect XDG purity, caching performance optimization, multi-user machine support

## What to Do

### 1. Parallel Probe Implementation

**Status**: GO — eliminate serial cache, accept runtime cost

```typescript
// Replace global-pm.ts serial loop with Promise.allSettled
const allResults = await Promise.allSettled(
  PROBE_ORDER.map(pm => probePM(pm, pkg))
)
// Rank by priority: pnpm > npm > yarn > bun
const matches = allResults
  .filter((r): r is PromiseFulfilledResult<DetectedPM> => 
    r.status === 'fulfilled' && r.value !== null)
  .map(r => r.value)
// First match wins, but collect ALL for shadowing warnings
const detected = matches[0] || null
const allMatches = matches // for uninstall shadowing warning
```

**Why**: 300-600ms wall time is acceptable for a CLI that users invoke explicitly (not a library). Zero stale risk is worth the cost for destructive operations. Parallel execution makes it competitive.

### 2. Persistent Store with `conf`

**Status**: GO — ecosystem precedent (configstore ← update-notifier lineage)

```typescript
import Conf from 'conf'

interface PMLedger {
  pmsSeen: AgentName[]
  lastPm: AgentName
  lastSeenAt: string // ISO timestamp
}

const store = new Conf<PMLedger>({
  projectName: 'jss-devtools',
  projectVersion: 1, // bump for migrations
  defaults: {
    pmsSeen: [],
    lastPm: 'npm',
    lastSeenAt: new Date().toISOString()
  }
})

// On every successful detection:
store.set('pmLedger', {
  pmsSeen: [...new Set([...store.get('pmLedger').pmsSeen, detected.pm])],
  lastPm: detected.pm,
  lastSeenAt: new Date().toISOString()
})
```

**Platform locations** (via env-paths, which conf uses internally):
- macOS: `~/Library/Application Support/jss-devtools/config.json`
- Linux: `~/.config/jss-devtools/config.json` 
- Windows: `%LOCALAPPDATA%\jss-devtools\config.json`

**Why**: `conf` handles atomic writes, schema validation (AJV), migrations, and platform-specific paths. This is the exact pattern update-notifier and popular CLIs (zx, svgexport) use. Avoids reinventing.

### 3. Uninstall Reads Ledger

**Status**: GO — warn about possible leftovers

```typescript
const ledger = store.get('pmLedger')
const previousPMs = ledger.pmsSeen.filter(pm => pm !== detected.pm)

if (previousPMs.length > 0) {
  logger.info(`Previously installed via ${previousPMs.join(', ')} — leftover copies possible`)
}

// Shadowing warning from parallel probe
if (allMatches.length > 1) {
  const shadowed = allMatches.slice(1).map(m => m.pm).join(', ')
  logger.warn(`Detected in multiple PMs: ${shadowed} — confirm removal targets correct copy`)
}
```

**Why**: Addresses the user's actual goal ("know which PM the user has EVER used") without trusting stale state for destructive decisions. The parallel probe provides current truth; ledger provides history context.

### 4. Graceful Degradation

**Status**: REQUIRED — handle read-only HOME and CI environments

```typescript
let store: Conf<PMLedger> | null = null
try {
  store = new Conf<PMLedger>({ /* ... */ })
} catch (err) {
  if (err?.code === 'EACCES' || err?.code === 'EROFS') {
    logger.debug('Config directory not writable — running in stateless mode')
    store = null
  } else {
    throw err // re-throw unexpected errors
  }
}

// Usage:
if (store) {
  store.set('pmLedger', { /* ... */ })
}
// Or a wrapper function:
updateLedger(detected) { try { store?.set(...) } catch { /* silent */ } }
```

**Why**: CI environments, read-only HOME mounts, and containerized setups may not allow config writes. `conf` doesn't explicitly handle this (see research), so graceful degradation is required. The CLI must function without persistent state.

## What to Avoid

### 1. Cache-PM-and-Trust
**Rejected for good reason**: Stale detection state is catastrophic for uninstall. A user switching from npm → pnpm could have npm uninstall a pnpm-installed copy (or fail to find it). Parallel probe eliminates this risk.

### 2. Hand-rolled Store with env-paths
**Rejected for good reason**: `conf` already handles atomic writes, migrations, schema validation, and platform differences. Reinventing is educational for learning but not aligned with "use what ecosystem built" strategy.

### 3. XDG Config/Cache Split (Now)
**Deferral is sound**: The single store with namespaced keys (`pmLedger`, future: `pm`, `updateCheck`) works for Phase 01. XDG purity (config vs cache) matters when:
- Data is large (cache handles rebuildable content)
- Multiple data types with different lifetimes
- User explicitly wants to wipe cache without affecting config

None of these apply yet. The ledger is tiny (KB scale) and semi-persistent. Split when update-notifier state grows or users request cache clearing.

## Failure Modes & Mitigations

### 1. Ledger Growth
**Risk**: `pmsSeen` array accumulates PMs indefinitely (unlikely to exceed 4-5 entries with current PM landscape).

**Mitigation**: NOT NEEDED in Phase 01. If PM ecosystem expands dramatically, add cleanup logic:
```typescript
// Future: prune to last 10 PMs, keep only those seen in last 6 months
const ledger = store.get('pmLedger')
ledger.pmsSeen = ledger.pmsSeen.filter(pm => 
  recentPMs.has(pm) || ledger.pmsSeen.length <= 10
)
```

### 2. Read-Only HOME / CI Environments
**Risk**: `conf` throws on write if HOME is read-only (CI, containers, mounted filesystems). Not documented in conf but standard Node EACCES/EROFS.

**Mitigation**: REQUIRED graceful degradation (see section 4 above). Wrap all `store.set()` calls in try/catch, fall back to stateless mode with debug log.

### 3. Multi-User Machines
**Risk**: Single user config assumes one user per system. Shared machines with multiple users could have conflicting PM installs.

**Mitigation**: OUT OF SCOPE for learning repo. This is edge-case territory. If needed later, add per-user detection or explicit `--pm` override.

### 4. Corrupted Config
**Risk**: JSON corruption from crash or manual edit breaks CLI startup.

**Mitigation**: `conf` has AJV schema validation. Add migration:
```typescript
const store = new Conf<PMLedger>({
  // ... 
  clearInvalidConfig: false // throw and let user fix, or set true to reset
})

// Or explicit version bump:
if (store.path && fs.existsSync(store.path)) {
  try {
    JSON.parse(fs.readFileSync(store.path, 'utf8'))
  } catch {
    logger.warn('Config corrupted, resetting...')
    store.clear()
    store.set('pmLedger', { /* defaults */ })
  }
}
```

### 5. XDG Config/Cache Split Deferral Bite-Back
**Risk**: Future update-notifier state grows large (release notes, version history), but stored in config due to single-store decision.

**Mitigation**: WHEN (not if) this happens, migrate with explicit version bump:
```typescript
// Phase 04: Add separate cache store
const cacheStore = new Conf({ projectName: 'jss-devtools-cache' })
store.set('updateCheck', { /* migrate to cache */ })
store.delete('updateCheck')
```

## Alternatives & Trade-offs

### Alternative 1: Cache PM + Validate on Use
**Rejected correctly**: No performance gain over parallel probe (~300-600ms vs ~100-200ms cache read + validation). Adds complexity without benefit. Parallel probe is simpler and always fresh.

### Alternative 2: Lockfile Detection Only (No Subprocess)
**Not applicable**: Global installs don't create lockfiles. Phase 03's lockfile detection (via package-manager-detector) is for local projects, not global PM detection. Keep subprocess probe for global.

### Alternative 3: User Override Flag Only (No Detection)
**Rejected correctly**: Defeats the purpose of automatic detection. User override (`--pm npm`) is a future escape hatch, not the primary workflow. Auto-detection is core UX.

## Work Checklist

1. **Refactor global-pm.ts**:
   - Replace serial loop with `Promise.allSettled`
   - Return both `detected` (first match) AND `allMatches` (for shadowing warning)
   - Remove per-process caching (cached variable)
   - Add ~300ms debug timing log

2. **Add conf dependency**:
   - `pnpm add conf`
   - Create `src/utils/store.ts` wrapper with graceful degradation

3. **Create PMLedger schema**:
   - `src/core/pm-ledger/types.ts`: interface + AJV schema (optional, conf has built-in)
   - `src/core/pm-ledger/ledger.ts`: updateLedger(), getLedger() functions

4. **Integrate into flow.ts**:
   - After successful detection, call `updateLedger(detected)`
   - Handle store init errors gracefully (fallback to stateless)

5. **Update uninstall.ts**:
   - Read ledger before confirm prompt
   - Show info line for previous PMs
   - Show warning for multiple current matches (shadowing)

6. **Add tests**:
   - Mock conf for CI environments (read-only HOME)
   - Test parallel probe returns all matches
   - Test ledger updates with graceful degradation

## Success Metrics

1. **Zero false-positive uninstalls**: No user reports of uninstall targeting wrong PM copy due to stale cache
2. **Graceful CI compatibility**: CLI functions in GitHub Actions, Docker, and read-only HOME without throwing
3. **Detects PM switches**: User installs via npm, switches to pnpm, uninstall warns about npm copy
4. **Performance acceptable**: Parallel probe completes in <1s on typical macOS/Linux dev machines (measured via debug timing)

## Assumptions

| Assumption | Confidence | What Would Change Answer |
|------------|-------------|--------------------------|
| Parallel probe ~300-600ms is acceptable for explicit CLI invocations | High | If users complain about slow startup, consider caching with TTL |
| `conf` handles platform-specific paths correctly (macOS ~/Library/Application Support, Linux ~/.config) | High | Verified via documentation and env-paths dependency |
| Users rarely switch PMs, so ledger growth is negligible | High | If PM ecosystem explodes (unlikely), add pruning logic |
| CI environments and read-only HOME are edge cases, not primary use | Medium | If many users hit this, prioritize graceful degradation and document stateless mode |
| XDG config/cache split deferral won't cause migration pain later | High | When update-notifier state grows, migration path is clear (version bump + separate store) |

## Unresolved Questions

None. The design is sound for Phase 01. Future phases will reveal if XDG split or ledger pruning is needed.

---

**Recommendation**: GO on the resolved design with REQUIRED graceful degradation for read-only filesystems. Parallel probe + conf is ecosystem-aligned, avoids stale-state risk, and extensibility is built-in via namespaced keys.

**Sources**:
- [conf npm package](https://www.npmjs.com/package/conf)
- [conf GitHub documentation](https://github.com/sindresorhus/conf)
- [XDG Base Directory Specification](http://specifications.freedesktop.org/basedir/basedir-spec-latest.html)
- [configstore GitHub](https://github.com/sindresorhus/configstore)