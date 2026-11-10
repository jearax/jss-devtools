---
id: 0043
title: JSX renders optional parts with && and groups attributes that share one condition
status: Accepted
date: 2026-11-10
supersedes: none
---

# 0043: JSX renders optional parts with && and groups attributes that share one condition

## Context

The site's components rendered optional parts as `value === undefined ? null : (…)` and repeated
`condition ? undefined : value` on every attribute that depends on the same condition (three times
on the terminal's tab panel). The design system is split: `packages/react` uses `&&`, `apps/site`
uses the explicit ternary.

## Decision

- An optional element is `{value && <Element />}`. Compare explicitly (`count > 0 && …`) only when the
  left side can be the number `0`, which React would render.
- Attributes that depend on one condition are built once as an object and spread
  (`const panelProps = tabs && { role: 'tabpanel', … }` then `{...panelProps}`), never one ternary per
  attribute. A single conditional attribute may stay inline (`aria-current={active ? 'page' : undefined}`).
- State still reaches the CSS through a `data-*` attribute, not a conditional class.

> "Bổ sung decision/convention code cho những chỗ như này. Terminal.tsx:183-193, clean code những chỗ
> undefined" (user, 2026-11-10)

Chosen option: "&& + gom props" (user, 2026-11-10).

## Options considered

| Option                             | Consequence                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| `&&` and grouped props (chosen)    | Shorter JSX, one condition per group; matches `packages/react`  |
| Explicit ternary and grouped props | Safe with `0` without thinking, but longer; matches `apps/site` |

## Consequences

- Easier: one place states when a group of attributes applies.
- Harder: a numeric left side needs a deliberate comparison.
- Enforced by: review, and `.harness/docs/site/conventions/component-conventions.md`.
