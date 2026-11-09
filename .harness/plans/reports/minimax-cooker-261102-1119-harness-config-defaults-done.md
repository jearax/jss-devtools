# Cooked the harness config defaults

Plan: [261102-1045-harness-config-defaults](../261102-1045-harness-config-defaults/plan.md), phase 1 only.

## Files changed

| File | Change |
| --- | --- |
| `src/modules/harness/templates/harness-config.template.ts` | The seven default values; the annotation changed from `: HarnessConfig` to `satisfies HarnessConfig` |
| `tests/harness-doctor.test.ts` | The memory limit and its padding are read from `HARNESS_CONFIG_DEFAULTS` |
| `tests/harness-update-units.test.ts` | The `DEFAULTS` fixture is now `HARNESS_CONFIG_DEFAULTS` |
| `tests/harness-hooks.test.ts` | `DEFAULT_CONFIG` is now `HARNESS_CONFIG_DEFAULTS`; the fixtures that pass their own config spread the default group and override one key |
| `tests/bundle.test.ts` | The sandbox `config.json` is written from `HARNESS_CONFIG_DEFAULTS` |
| `tests/harness-install-plan.service.test.ts` | One test pins the seven decided values as literals (added in review round 1) |
| `plans/261101-0204-init-harness/content/.harness/config.json` | The draft now matches the template |
| `plans/261102-1045-harness-config-defaults/plan.md`, `phase-01-change-the-defaults.md` | `status: completed` |

## Gate

```
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
 Test Files  27 passed | 1 skipped (28)
      Tests  427 passed | 7 skipped (434)
✔ Build complete in 10ms   dist/hooks.mjs  23.72 kB │ gzip: 6.72 kB
✔ Build complete in 33ms   dist/cli.mjs  322.08 kB │ gzip: 83.91 kB
```

Lint and typecheck printed nothing beyond their command lines, which is the clean result.

## The init run

`node dist/cli.mjs init demo-project --pm pnpm -y` in a temp folder outside this repository, then
the generated `.harness/config.json`:

```json
{
	"review": {
		"minToolCalls": 7
	},
	"memory": {
		"maxChars": 4800,
		"maxEntryChars": 300
	},
	"curator": {
		"minLearnedSkills": 10,
		"intervalDays": 7,
		"staleDays": 14,
		"archiveDays": 28
	}
}
```

`harness update -y` was then run on that repository after deleting `curator.intervalDays` and
setting `memory.maxChars` to `1234`. The update rewrote the missing key with the default `7` and
left `1234` alone, which is the second acceptance bullet of the plan.

## Deviations

- The template's type annotation changed from `: HarnessConfig` to `satisfies HarnessConfig`. The
  `HarnessConfig` type has every key optional, so `HARNESS_CONFIG_DEFAULTS.memory.maxChars` typed
  as `number | undefined` and the tests that read it needed a fallback that would have hidden a
  missing key. `satisfies` keeps the check that the object is a valid `HarnessConfig` while giving
  the exported constant its precise shape. No runtime behaviour changed.
- The plan's Acceptance bullet "tests that pass their own config keep it" was read as "keep the
  intent of the config, not the literal". The fixtures in `harness-hooks.test.ts` that deliberately
  narrow a group (a `maxChars` of 100, a `maxEntryChars` of 20) now spread the default group and
  override one key, so they keep their meaning and can never drift from the shipped defaults
  again. The values that decide the assertion are unchanged.
- No docs print a default value, so `docs/` needed no change (`grep -rn 3000 docs` found nothing).

## Round 1 fixes

The review found one real gap: moving every test onto `HARNESS_CONFIG_DEFAULTS` had removed the
only place the decided values were written down, so a wrong edit to the template would have left
the whole suite green. `grep -rn "4800|minToolCalls: 7|maxEntryChars: 300|archiveDays: 28" tests/
src/` confirmed it — the values existed only in the template.

`tests/harness-install-plan.service.test.ts` now pins them as literals in one test, the file that
already checks what `init` installs:

```ts
it('installs the decided config defaults', () => {
	const content = entryFor(harnessInstallEntries(createInput()), '.harness/config.json')?.content ?? '';

	expect(JSON.parse(content)).toEqual({
		review: { minToolCalls: 7 },
		memory: {
			maxChars: 4800,
			maxEntryChars: 300
		},
		curator: {
			minLearnedSkills: 10,
			intervalDays: 7,
			staleDays: 14,
			archiveDays: 28
		}
	});
});
```

Every other test still reads the constant, as the review asked.

The pin was proved by mutation, not by inspection: `memory.maxChars` was temporarily changed to
`480` in the template and the new test failed on the value, while the whole suite ran
`Tests 1 failed | 10 passed (11)` in that file and `Failed Tests 11` overall. The template was
restored afterwards, and `git diff` of it is the seven intended values only.

Full gate after the fix, unedited:

```
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
 Test Files  27 passed | 1 skipped (28)
      Tests  428 passed | 7 skipped (435)
✔ Build complete in 29ms
ℹ dist/cli.mjs  322.08 kB │ gzip: 83.91 kB
```

The count went from 427 to 428: the one new test. A fresh `init -y` into a temp folder with the
rebuilt bundle wrote the same seven values as before:

```json
{
	"review": {
		"minToolCalls": 7
	},
	"memory": {
		"maxChars": 4800,
		"maxEntryChars": 300
	},
	"curator": {
		"minLearnedSkills": 10,
		"intervalDays": 7,
		"staleDays": 14,
		"archiveDays": 28
	}
}
```

## Not done

- Nothing was committed or pushed, per the brief.
- The work record for this change is [the journal for this plan](../journals/2026-11-02-cooked-the-harness-config-defaults.md)
  and this report.
