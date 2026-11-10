---
id: 0042
title: Site UI work is delegated, but every value comes from the design system
status: Accepted
date: 2026-11-10
supersedes: none
---

# 0042: Site UI work is delegated, but every value comes from the design system

## Context

The user handed the site's styling and UI/UX decisions to the agents doing the redesign. A landing that
chases a reference site can drift into raw colours, arbitrary sizes or a type scale the design system
does not have, which breaks the ecosystem alignment of [0041](0041-the-site-runs-the-stable-design-system-packages.md).

## Decision

Agents may decide the site's layout, composition, copy structure and interaction design without asking.
Every colour, size, space, radius, shadow, duration, z-index, text role and theme value comes from
`@jjuidev/styles` (and the site skin's scale values). No raw colour, no arbitrary value, no local token
standing in for a missing one, no text role above `3xl` (the design system's 0053). When a design cannot
be reached inside the system, the gap is reported, not worked around.

> "Full delegate for you, full permission and decision UI/UX" (user, 2026-11-10)

> "Styling và UI for delegate, nhưng điều kiện tiên quyết là vẫn phải giữ vững design system, phải dùng
> theo design system về token, theme,..." (user, 2026-11-10)

## Options considered

| Option                              | Consequence                                                      |
| ----------------------------------- | ---------------------------------------------------------------- |
| Delegate inside the system (chosen) | Fast UI iteration; the site stays one product with the ecosystem |
| Delegate with site-local exceptions | Rejected by the user: a local token is a fork of the system      |

## Consequences

- Easier: UI rounds need no approval for layout or interaction choices.
- Harder: a bigger hero, a new colour or a new size is a design-system change, not a site change.
- Enforced by: review (grep the site diff for raw colours, length literals and `[...]` values).
