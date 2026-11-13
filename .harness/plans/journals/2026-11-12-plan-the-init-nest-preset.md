# Plan the init nest preset

Plan: [261112-1647-init-nest-preset](../261112-1647-init-nest-preset/plan.md). Decision:
[0047](../../decisions/0047-init-nest-preset.md).

- The user's first intent was to run `nest new` at init and overlay the toolchain. A probe of
  `@nestjs/cli` 12.0.12 showed it writes 17 files, of which the preset would delete 6 and rewrite
  5, while costing a network fetch at init and a write before preflight finishes. The user moved
  to files shipped with the CLI, then asked for them as a real project folder, `templates/nest/`.
- The repository already embeds file text through tsdown `define` (`__HARNESS_HOOK_BUNDLE__`);
  the template map reuses that path rather than a new build mechanism.
- Validation library: zod over yup because, through Standard Schema, zod hands Nest's pipe its full
  issue (`code`, `origin`, `format`) while yup hands only `message` and `path`, so only zod allows
  translation by the request's language. yup's `url()` also rejects `postgres://` URLs.
- `@nestjs/i18n` 0.0.3 was found in Nest 12's generated `AGENTS.md`; it has not been run yet.
  Phase 1 proves it and stops if it fails.
- Decision 0028 (no import extensions) governs this repository only, so the Nest preset's `.js`
  imports do not supersede it.
