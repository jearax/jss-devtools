---
title: Cooked the harness config defaults
date: 2026-11-02
summary: "Changed the seven defaults that jss-devtools init writes to .harness/config.json to 7 / 4800 / 300 / 10 / 7 / 14 / 28, and moved every test that asserted a default onto the source constant"
---

# Cooked the harness config defaults

## What happened

The [harness config defaults plan](../261102-1045-harness-config-defaults/plan.md) was cooked, its
only phase. `jss-devtools init` and `harness update` now write `review.minToolCalls` 7,
`memory.maxChars` 4800, `memory.maxEntryChars` 300, `curator.minLearnedSkills` 10,
`curator.intervalDays` 7, `curator.staleDays` 14, `curator.archiveDays` 28. The report is
[minimax-cooker-261102-1119](../reports/minimax-cooker-261102-1119-harness-config-defaults-done.md).

## Findings

- **`satisfies` beat the `: HarnessConfig` annotation.** `HarnessConfig` types every key optional,
  so `HARNESS_CONFIG_DEFAULTS.memory.maxChars` was `number | undefined` and a test reading the
  limit needed a fallback that would have hidden a missing key. `satisfies HarnessConfig` keeps the
  shape check and gives the exported constant its precise type; no runtime behaviour changed.
- **A literal default in a test is a second home for it.** Four test files repeated the shipped
  numbers. The doctor test was the sharp case: it sized its memory padding against the limit, so
  changing the limit without resizing the padding would have asserted a limit the test never
  exceeded. Every test that meant "the default" now reads `HARNESS_CONFIG_DEFAULTS`; the fixtures
  that mean "this config" spread the default group and override one key.
- **`harness update` still respects an edited value.** On a repository with `curator.intervalDays`
  deleted and `memory.maxChars` set to `1234`, the update wrote back the missing key with the new
  default `7` and left `1234` untouched. The acceptance bullet about update held without a code
  change.
- **A test that reads the constant cannot police the constant.** Moving every test onto
  `HARNESS_CONFIG_DEFAULTS` removed the only place the decided values were written down, so a
  wrong edit to the template left the suite green. One test now states them as literals — the
  `config.json` `init` installs — and the pin was proved by mutating the template to
  `maxChars: 480` and watching that test fail, not by reading it.

## Measurements

Gate on Node 24.22.0: lint clean, typecheck clean, `Test Files 27 passed | 1 skipped (28)`,
`Tests 428 passed | 7 skipped (435)` after the review round added the one test that pins the
decided values, build `dist/cli.mjs 322.08 kB │ gzip: 83.91 kB`. One real `init -y` into a temp
folder wrote the seven new values.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
