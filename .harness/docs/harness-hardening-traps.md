# Harness-hardening traps

Traps from the harness-hardening work: the hook bundle, path safety, the redaction rules and the
content check, and the test helpers around them. The mechanisms themselves are in
[system-architecture.md](./system-architecture.md) under "The harness module".

## The hook bundle cannot import the update chain

Hook-side code (the hooks, and any service they import) must not import `update-manifest`,
`install-plan` or anything that reaches the hook-bundle constant: the built `hooks.mjs` then
embeds its own bundle with unreplaced define placeholders and crashes at load. Hook-side reads of
config or state go through the path-safety helpers and local constants instead. This is also why
`health-install.service.ts` and the other doctor-side checks stay out of the hooks' import graph.

## Path safety: what counts as unsafe and who refuses

`pathSafetyOf` lstats each existing component and realpaths the deepest existing ancestor; the
root itself may sit behind a symlink (macOS `/tmp`). Hook-side helpers treat an unsafe path as a
missing file; the update readers and `harness update` preflight throw instead, naming the path.
Init seeds (`MEMORY.md`, `BOOTSTRAP.md`, the decisions/docs/plans READMEs) are written once and
are not manifest entries, which is why the update preflight also checks the fixed harness folders.

## The content check's published set

A tracked file stays in `git ls-files --cached` regardless of `.gitignore`; the published set is
cached plus others-not-ignored. To test a file as ignored, `git rm --cached` it first.

## Redaction rules

The patterns carry the `g` flag at module level, so the finder uses `matchAll` only:
`.test()`/`.exec()` keep `lastIndex` between calls and silently miss matches. An unbounded leading
character class (the email and url-credentials rules) makes a pattern quadratic on a long line —
a 200 kB line took 17 seconds until the classes were bounded. Token samples in the tests are
built at run time (`'sk_' + 'live_' + 'x'.repeat(24)`), so no literal token sits in the test file
for GitHub push protection or a scanner to flag.

## Test helpers

`ageBase` in `tests/harness-update.test.ts` rewrites the manifest sha256 to match the drifted base
copy, so a test using it can never hit the base-drift refusal; write the base copy with
`writeFile` directly instead. `harnessRelease` is stubbed in the update tests, so a test that
depends on the resolved `knowledge.share` builds its own release object instead of relying on the
stub.
