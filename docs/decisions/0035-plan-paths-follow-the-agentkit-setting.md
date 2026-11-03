---
id: 0035
title: with AgentKit the harness teaches no plan path, the plan skill decides the layout
status: accepted
date: 2026-11-03
supersedes: none
---

# 0035: with AgentKit the harness teaches no plan path, the plan skill decides the layout

## Context

Decision [0034](./0034-claude-block-follows-agentkit.md) gave the `CLAUDE.md` block two variants and
the folder READMEs none, because an AgentKit line in each README repeated the same rule in four
files and named the folder the reader was already in.

That decision left the plan paths out of the variant. The block's table row read
`.harness/plans/active/<YYMMDD>-<slug>.md` whatever the setting was, and the same row sat above
the bullet that says AgentKit owns `.harness/{docs,plans}/`. The block contradicted itself: it
taught a harness-only path in the one repository whose plan folder belongs to AgentKit.

The two managed files that carry a plan path taught the same stale convention in every repository:
`.harness/plans/README.md` (one file per plan, `active/`, `completed/`, `git mv`) and
`.harness/templates/README.md` (the row pointing at `../plans/active/<YYMMDD>-<slug>.md`).
`.harness/templates/plan.md` taught the harness plan shape, `active/` and `completed/` included.

In a repository with AgentKit the real layout is a different one: a plan is a folder,
`.harness/plans/<YYMMDD>-<HHMM>-<slug>/`, holding `plan.md` and its phase files, with the reports
beside the plan folders. There is no `active/` and no `completed/`. An agent that followed the
harness files would look for a path that does not exist.

The AgentKit hook injects the plan directory, the plan naming and the reports directory at every
session start. The plan layout of a repository is therefore already known at run time, and a path
written into a harness file is a second, static copy of a fact that the session states fresh.

## Decision

**With AgentKit the block drops the plan row.** The knowledge table of the `CLAUDE.md` block has no
"Work spanning sessions" row when the AgentKit setting is on: the table says where each kind of
knowledge goes, and in that repository the harness does not own plans, so it has nothing to say
about them. The ownership bullet — "AgentKit owns `.harness/{docs,plans}/`: follow its skills
there" — is the only place in the block that speaks about plans, and it says who writes them.

**The process bullet follows.** The line under "Match the process to the work" that names a plan no
longer points at the table row, because there is no row to point at. With AgentKit it points at the
skill that owns the plan folder, without naming that skill.

**With AgentKit the harness teaches no plan path at all.** The two folder READMEs have an AgentKit
variant, chosen by the same `usesAgentKit` detector as everything else, and in that variant neither
of them writes a plan path:

- `.harness/plans/README.md` says the folder holds the plans of work that spans sessions, that the
  plan skill that owns the folder decides the layout, and that the file is the index of the folder:
  a row is added or removed in the same change as the plan.
- `.harness/templates/README.md` points the plan template at the plan skill rather than at a path,
  and names the plans README as the index to update.

`.harness/templates/plan.md` keeps its own variant and defers the format to the plan skill.

**Why no path, beyond the ownership bullet.** Two reasons, and they pull the same way. The first is
the reason from 0034: the ownership rule is read in the block, so repeating it in four files names
the folder the reader is already in. The second is drift: the AgentKit hook injects the real plan
directory, the plan naming and the reports directory at every session start, so the path a session
actually uses is known at run time. A path written into a harness file is a snapshot of that
knowledge and can contradict it the moment the convention changes — and nothing in the repository
would notice. Teaching no path keeps the single source of truth where it already is: the hook.

**No folder README names AgentKit.** The ownership rule stays in the block, which is the one file
every agent loads, and the reason from 0034 still holds. The plans README of the AgentKit variant
says "the plan skill that owns this folder".

**The kind of the plans README follows the owner of its content.** The harness-only variant
describes a layout the harness owns, so it stays a managed file the update replaces. The AgentKit
variant is an index the plan skill maintains, so it is a seed: the harness writes it once and the
repository owns it afterwards, and the update hands it over in either direction instead of
overwriting what the repository wrote.

**The harness-only variant is unchanged.** A repository without AgentKit sees byte-for-byte the
same four files it saw before, so the fix costs a repository that does not use AgentKit nothing.

**0034 stands except for one clause.** Its clause "the folder READMEs have none" no longer holds:
the two READMEs now vary with the setting. Everything else in 0034 stands — how the setting is
detected, the block's two variants, and the READMEs naming no tool. 0034 is not edited and not
marked superseded; this record amends that one clause.

## In the user's words

> "plan-path là biến thể theo agentKit — block CLAUDE.md VÀ hai README (plans, templates) có hai biến
> thể theo agentKit, nhưng không README nào nêu tên AgentKit (giữ nguyên lý do gốc của 0034: không lặp
> luật sở hữu bốn file)" — the plan paths follow the setting, and the READMEs still name no tool.
> (user, 2026-11-03)

> "Câu 'the folder READMEs have none' trong 0034 hết hiệu lực — KHÔNG sửa 0034, ADR mới supersede câu
> đó" — that clause of 0034 stops holding; 0034 itself is not edited, a new record amends it.
> (user, 2026-11-03)

> "khi agentKit=true, XOÁ HẲN hàng 'Work spanning sessions' khỏi bảng 'Where knowledge goes' trong
> claude-block ... vì bullet 'AgentKit owns .harness/{docs,plans}/' ở ownership bullets đã phủ đủ" —
> the row goes away entirely, because the ownership bullet already covers plans. (user, 2026-11-03)

> "áp dụng cùng nguyên lý 'bỏ dạy path khi agentKit=true' cho CẢ HAI README" — the same principle
> covers both READMEs, not only the block. (user, 2026-11-03)

> "ngoài DRY với bullet sở hữu, hook của AgentKit inject đường dẫn plan thật vào mỗi phiên nên mọi
> path tĩnh trong harness file là rủi ro drift" — the hook injects the real plan path every session,
> so a static path in a harness file drifts. (user, 2026-11-03)

## Options considered

| Option                                                          | Consequence                                                                                                                 |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Teach no plan path when AgentKit is on (chosen)                 | One source of truth for the plan layout: the hook that injects it every session; a repository without AgentKit is untouched |
| Teach the harness-only layout in every repository               | One copy of every file, but a repository with AgentKit teaches a path that does not exist — the bug this record fixes       |
| Teach the AgentKit layout in the READMEs                        | Rejected: the layout is a snapshot of what the hook injects, so it drifts the day the convention changes                    |
| Keep a plan row in the block, pointing at the AgentKit layout   | Rejected: the row says where the harness writes a plan, and in that repository it writes none; the ownership bullet says it |
| Name AgentKit in the folder READMEs                             | Rejected: it repeats the ownership rule in four files and names the folder the reader is already in, the reason 0034 gave   |
| Drop the plan template and the plans README when AgentKit is on | Removes a file from an installed repository; a lifecycle change the fix does not need                                       |
| Edit 0034 in place                                              | Rejected: an accepted decision is never edited; a new record supersedes the clause                                          |

## Consequences

- The `CLAUDE.md` block differs between the two variants in the ownership bullets, in the presence
  of the "Work spanning sessions" row and in the one process bullet that names a plan.
- With AgentKit, neither folder README writes a plan path. The plan folder, its naming and the
  reports directory come from the hook, and the files that would have repeated them now point at
  the skill that owns the folder.
- `.harness/plans/README.md` and `.harness/templates/README.md` change on `harness update` in a
  repository that gained or lost `.agentkit/config.yaml`. They are managed files, so the update
  rewrites them.
- The ownership rule is read in one place, the block. A folder README describes its folder and
  names no tool.
- The AgentKit variant of `.harness/templates/plan.md` still names the plan file it produces and
  defers the format to the plan skill. A path there is the one case left: a template has to say
  what it is a template for.
- Enforced by: `tests/harness-install-plan.service.test.ts` (a snapshot of the harness-only variant,
  the absence of the plan row and of `plans/active` and `completed/` from the AgentKit variant, the
  absence of any plan path from both READMEs, and the fact that no README names AgentKit) and
  `tests/harness-update.test.ts` (the update writes the AgentKit variant into the managed plan
  files of a repository that holds the AgentKit config).
