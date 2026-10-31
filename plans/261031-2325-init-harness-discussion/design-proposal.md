# Design proposal: what `init --harness` writes and how it runs

Status: accepted with three changes, recorded in the decision log (2026-11-01): variant files
stay, the `update` outro suggests no commit, no skill disables model invocation. Decisions already taken are in
[decision-log.md](./decision-log.md); this file proposes the rest. The user asked for one best
option: "đề xuất cho tôi 1 option best nhất" (user, 2026-11-01).

Base: the old prototype H0 (`/Users/tandm/Documents/jearax/dokploy/harness`, `assets/manifest.json`,
`src/hooks/`, `src/core/harness-limits.ts`), K1, K2 and K3 as recorded in the
[knowledge base](../261019-1050-jss-devtools-rewrite/knowledge-base.md), and the current Claude Code
hooks reference (`https://code.claude.com/docs/en/hooks`, read 2026-11-01).

## 1. Files in the user's repository

Kinds, as in H0's manifest: **managed** (the CLI owns it; `harness update` replaces it by
three-way merge), **seed** (written once, then owned by the user and the agent; update never
touches it), **block** (the `<!-- HARNESS:BEGIN -->` to `<!-- HARNESS:END -->` region of a user
file), **merge** (entries merged into a user file), **config** (user-edited, merged key by key),
**CLI-owned** (written by the CLI for itself), **local** (gitignored, per machine).

| Path | Kind | Purpose | Change from H0 |
| --- | --- | --- | --- |
| `CLAUDE.md` block | block | Agent rules, knowledge routes, stop-and-ask, done-means-proven | Same, with its variant file for repositories without AgentKit |
| `.claude/settings.json` hook entries | merge | Wire the four hooks | Hook options change, see section 2 |
| `.claude/skills/harness-onboard/SKILL.md` | managed | First-session ritual | Same role |
| `.claude/skills/harness-review/SKILL.md` | managed | Learning step | Same role |
| `.claude/skills/harness-curate/SKILL.md` | managed | Library upkeep | Same role |
| `.harness/config.json` | config | Every harness setting with its default | New; replaces the settings half of `curator.json` |
| `.harness/MEMORY.md` | seed | Short-fact index, injected at session start | Same |
| `.harness/BOOTSTRAP.md` | seed | Onboarding pending while it exists; the onboard skill deletes it | Same; its absence is the completion state |
| `.harness/decisions/README.md` | seed | Decision index; decisions quote the user | Same |
| `.harness/docs/README.md` | seed | Long-form knowledge index | Same |
| `.harness/templates/**` | managed | Shapes for a decision, a skill, a doc topic, an architecture doc, a runbook | Same |
| `.harness/archive/` | created on demand | Learned skills the curator retired | Same |
| `.harness/bin/harness-hook.mjs` | managed | Shim: below Node 24 exit 0, any error exit 0, then import the hook bundle | Same (decided) |
| `.harness/bin/hooks.mjs` | managed | Hook-only bundle built from `src/modules/harness/` | Replaces the 160 KB full CLI bundle (decided) |
| `.harness/core/manifest.json` | CLI-owned, committed | CLI version, each managed path with its kind and hash | Same role |
| `.harness/core/base/**` | CLI-owned, committed | Base copy of each managed and config file, for the three-way merge | Same role |
| `.harness/.gitignore` | managed | Ignores `state/` and `update/` | `backup/` dropped |
| `.harness/state/` | local | Session event logs, skill usage, hook error log | Event logs replace read-modify-write state, see 2.3 |
| `.harness/update/` | local | Conflict staging for `harness update --continue` | Same (decided) |
| `.harness/plans/README.md` | managed, with its variant | With AgentKit, ak's plans directory; without, `active/` then `completed/` | Same as H0 (decision 0013) |

Dropped from H0:

- `.harness/bin/harness.mjs`, the full CLI bundle: replaced by the hook-only bundle.
- `.harness/backup/`: the CLI never commits, so every change is in the working tree for `git diff`
  and git is the backup. An existing harness file at install is a conflict that exits 1 like init's
  owned configs, overwritten only with `-f`.
- `.harness/curator.json`: settings go to `config.json`, run state (last curation) to `state/`.

## 2. Hooks

### 2.1 Events and options

| Event | Matcher | Mode | Does |
| --- | --- | --- | --- |
| `SessionStart` | `startup\|resume\|clear\|compact` | sync | Injects `MEMORY.md`, the decision index, the onboarding notice while `BOOTSTRAP.md` exists, memory-size and hook-error warnings, through `additionalContext` |
| `PostToolUse` | `Write\|Edit\|MultiEdit` | sync | Memory guard only: when the file is `.harness/MEMORY.md` and it breaks a limit, returns `decision: "block"` with the reason, so the agent fixes it in the same turn |
| `PostToolUse` | none | **async** | Appends one event: tool call counted (subagents skipped by `agent_id`), skill used (Skill tool, or `SKILL.md` read by Read or Bash), onboarding asked |
| `PostToolUseFailure` | none | **async** | Appends the failure: tool, first line of `error`, secrets redacted; `is_interrupt` skipped |
| `Stop` | none | sync | Exits at once when `stop_hook_active`. Otherwise, in this order: onboarding pending and not asked this session, then review due, then curation due; returns the request through `additionalContext` |

Why these choices:

- **`async: true` on the counting hooks.** H0 ran every PostToolUse synchronously, so each tool
  call waited for a Node start. The reference: async hooks "run the hook in the background while
  Claude continues working" and "can't block or control Claude's behavior", which the counters
  never need. The memory guard must block, so it stays sync, and only on the three edit tools.
- **`additionalContext` on Stop, not `decision: "block"`.** The reference says it "keeps the
  conversation going through the same loop protections as `decision: "block"`, namely the
  `stop_hook_active` input and the 8-consecutive-continuation cap, but the transcript labels it
  `Stop hook feedback` and no hook error notification is shown".

### 2.2 Rejected

- **A `prompt` or `agent` Stop hook** that asks a model whether the session holds a lesson: one
  model call on every turn, up to 30 or 60 seconds, and a non-deterministic gate. The review skill
  already makes that judgement, once, when it runs.
- **A Hermes-style background review** (an async Stop hook that starts `claude -p` to review):
  it edits the repository while the user's session is still working in it, needs its own
  authentication and spends tokens unseen, against "Agent đề xuất, người quyết".
- **`SessionEnd`**: a 1.5 second default budget, and nothing the session can still act on.
- **Forcing onboarding**: `initialUserMessage` works only with `-p`, confirmed again in the
  reference, so the Stop hook asks once per session (H1, as H0's decision 0018).

### 2.3 State without races

The reference: "`PostToolUse` fires once per tool, which means it fires concurrently when Claude
makes parallel tool calls." H0 read, changed and rewrote one session JSON file per event, so two
parallel tool calls can lose a count. Proposal: each event appends one line to
`.harness/state/sessions/<session_id>.jsonl` (a single small append), and only the Stop hook
reads and folds the log. Logs older than seven days are removed (H0's `STATE_TTL_MS`).

## 3. When review and curation are asked for (H4)

Init requires a git repository, so the worktree fingerprint H0 built is always available, and
H0's edit counter (its "non-git fallback") is no longer needed.

- **Review is due** when, since the last review in this session, the worktree fingerprint changed
  and at least `review.minToolCalls` tool calls ran, or any tool failed. This is the knob of the
  user's example ("8 lần hay 10 lần"); H0 used 8, Hermes 10.
- **Curation is due** when there are at least `curator.minLearnedSkills` learned skills and the
  last curation is older than `curator.intervalDays`. H0 deferred archiving until ten learned
  skills existed; this keeps that rule as a setting.

## 4. Skills (H9, H10)

- The three `harness-*` skills are invoked by name when a hook asks for them, or by the user. Their
  descriptions say exactly that, so they do not fire on unrelated work. They stay invocable by the
  model, because the Stop hook asks the agent to run them.
- **Learned skills** carry `metadata.harness-origin: learned` (H0's marker, K2's "provenance is
  declared, never inferred") and trigger on their description, which is the point of learning.
- **What review may edit**: learned skills, `MEMORY.md`, `docs/`, new decisions that quote the
  user. Never `harness-*` skills, `.harness/templates/`, `.harness/core/`, `.harness/bin/`, or
  AgentKit's `ak-*`. Order of preference from K2: patch the skill that was used, then an umbrella
  skill, then a support file, then a new class-level skill. Never delete; never commit.
- **What curation may do**: propose archiving learned skills unused for `curator.archiveDays`
  into `.harness/archive/`, and propose merges. The user decides; nothing is deleted.

## 5. `.harness/config.json`

Every key is written with its default (decided). Values from H0's `harness-limits.ts`:

```json
{
  "review": { "minToolCalls": 8 },
  "memory": { "maxChars": 3000, "maxEntryChars": 240 },
  "curator": { "minLearnedSkills": 10, "intervalDays": 7, "staleDays": 14, "archiveDays": 30 }
}
```

Only settings someone may want to change are keys. Values nobody tunes (git timeout, failure log
length, state lifetime) stay constants in the code.

## 6. What `harness update` needs from `init --harness`

The three-way merge needs a base, so `init --harness` writes `.harness/core/manifest.json` and
`.harness/core/base/` in the same run. Without them, the first update would have nothing to merge
against.

## Points settled after the proposal (user, 2026-11-01)

- **Skill usage stays per machine** in `state/`. Answered "OK". The curator sees only the current
  machine's usage and may propose archiving a skill a teammate uses; archive is reversible and
  shows in `git diff`, while a committed usage file (H0's choice) dirties the tree every session.
- **No skill sets `disable-model-invocation`.** The skills reference (read 2026-11-01): it
  "prevent[s] Claude from automatically loading this skill", removes its description from context,
  and is meant for "workflows with side effects or that you want to control timing, like
  `/commit`, `/deploy`". The `harness-*` skills must stay model-invocable because the Stop hook asks
  the agent to run them, and learned skills exist to be picked up by their description. None of
  them commits or deploys. The review skill must write a learned skill's description with its main
  use case first, since description and `when_to_use` are cut at 1,536 characters.
- **The `update` outro suggests no commit command.** First answered "Có", then reversed: "đổi ý
  lại - không outro không gợi ý commit".
