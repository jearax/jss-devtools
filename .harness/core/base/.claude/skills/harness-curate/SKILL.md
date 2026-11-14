---
name: harness-curate
description: Keep the harness knowledge small and true: shrink memory, merge overlapping learned skills, propose archiving idle ones, resolve conflicting decisions. Run when the Stop hook says curation is due, or when the user asks to clean up harness knowledge.
---

# Harness curate

Curation removes, merges and moves; it never adds knowledge, which is review's job. Settings are in
`.harness/config.json` under `curator` and `memory`.

1. If `jss-devtools` is installed, run `jss-devtools harness doctor` and read every issue.
2. **Memory**: bring `.harness/MEMORY.md` under 70% of `memory.maxChars`. For each line: keep,
   shorten, merge, move to a doc with a pointer line, or delete. Check each `(src: ...)` against
   its source and delete what no longer holds.
3. **Learned skills** (`metadata.harness-origin: learned` only): fix steps that drifted from the
   code. Then propose to the user, from `.harness/state/skill-usage.json`:
   - merging skills whose triggers overlap into the clearer one;
   - archiving skills not used for `curator.archiveDays`, unless `harness-pinned: "true"`.
     Apply only what the user accepts. Archiving moves the folder to `.harness/archive/<name>/`;
     nothing is deleted.
4. **Your own memory**: entries about this repository that a teammate would need move into
   `.harness/MEMORY.md` or `.harness/docs/`. Ask before removing them from your memory; leave
   personal entries alone.
5. **Decisions**: when two decisions in force conflict, ask the user which wins, then write a new
   decision superseding the other.
6. Never stage or commit. List every file changed, archive moves included, for the user to commit
   when knowledge is shared, with `.harness/curator.json`, which the Stop hook updates at the end
   of this turn: committing it tells teammates the curation is done.

## Pitfalls

- Usage is counted on this machine only; a skill idle here may be used by a teammate. Say so when
  proposing an archive.
- Never touch a skill without the learned marker.
