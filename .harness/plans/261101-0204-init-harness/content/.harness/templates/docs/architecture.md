# Template: architecture doc

For `.harness/docs/architecture.md`, the one system overview.

- **When**: onboarding a repository with code, or a change that adds, removes or rewires a
  component, a boundary or an external dependency. Update it in that change.
- **One file**: a component that outgrows its table row gets a topic doc linked from here.
- **Content**: what exists now, proven by entry points, config and tests `(src: ...)`. No roadmap;
  the reasons for a choice live in decisions.
- **Diagram**: a Mermaid `flowchart LR` only when it replaces more than a paragraph, under ~15 nodes.
- **Index**: its row in `../docs/README.md`.
- Under ~200 lines.

```markdown
---
title: Architecture
kind: architecture
sources: [<entry point>, <config>]
---

# Architecture

> What the system does and for whom, in one sentence.

## Components
| Component | Path | Responsibility |
|---|---|---|

## Main path
Numbered steps of the main request or job, naming the file at each step.

## Boundaries
- What must never cross a boundary, and what enforces it (test, type, lint rule, CI).

## External dependencies
| Dependency | Used for | On failure |
|---|---|---|

## Build, test, run
The exact commands, and what about them is not obvious.
```
