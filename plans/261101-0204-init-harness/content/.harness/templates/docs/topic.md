# Template: topic doc

For `.harness/docs/<topic>.md`: one area of the repository, longer than a memory line.

- **When**: a fact needs more than one line, or several memory lines describe one area. Move them
  here and leave one line in `.harness/MEMORY.md`: `- <fact>. See .harness/docs/<topic>.md`.
- **Scope**: one topic per file; extend an existing doc before adding a near-duplicate.
- **Content**: current behavior only, each claim with `(src: path:line)`. History, plans and
  decisions are linked, not copied.
- **Truth**: read the sources before writing; prefix a claim you could not verify with
  "Unverified:". Fix or delete a claim that no longer holds when you touch the area.
- **Index**: its row in `../docs/README.md`, in the same change.
- Under ~150 lines; split by sub-topic when it grows.

````markdown
---
title: <topic>
kind: topic
sources: [<path>, <test path>]
---

# <Topic>

> What a teammate must know about this area, in one sentence.

## How it works
Current behavior, naming files and functions as `path:line`.

## Rules
- Rule, why it holds. `(src: path:line)`

## Traps
- What goes wrong, how it shows (exact error text), how to avoid it.

## Verify
```bash
<command that proves the claims above still hold>
```
````
