# Decision log: `init --harness`

Discussion record for the harness flow. Each section quotes the user and states what follows from
it. Background: [knowledge base](../261019-1050-jss-devtools-rewrite/knowledge-base.md),
[open questions H1 to H12](../261019-1050-jss-devtools-rewrite/open-questions.md).

## Harness is a feature of `jss-devtools`, not a second CLI (2026-11-01)

Answered with the option "Chức năng của jss-devtools (Recommended)" (user, 2026-11-01), after the
user asked "Hay là khi install.sh thì bản chất cài 2 CLI luôn, là jss-devtools và harness?".

- One CLI, one bundle, one entry point (`src/cli.ts`), one artifact; `install.sh` installs only
  `jss-devtools`. The project overview already states "The CLI does two things".
- Harness is installed into a repository with `jss-devtools init --harness`. Work after the install
  (the first is `update`) becomes a `jss-devtools` subcommand; its name is not decided yet.
- A separate `harness` CLI is rejected: two versions to keep in step while harness runs inside the
  init flow, two artifacts, and the stdout coupling the old prototype suffered. The name `harness`
  also clashes with K1's Rust binary. A short launcher can be added to `install.sh` later if one is
  wanted, without splitting the code.
- The update command is `jss-devtools harness update`: noun then verb, Docker style, so every
  harness operation after the install sits under `jss-devtools harness`. "Vậy là `jss-devtools
  harness update` là chuẩn hen." (user, 2026-11-01). It runs its own flow, not init's, takes only
  its own flags, and exits 1 pointing at `jss-devtools init --harness` when the repository has no
  harness.
- The harness plan covers both `jss-devtools init --harness` and `jss-devtools harness update`:
  "giờ mình đang plan để thảo luận cho jss-devtools init --harness, jss-devtools harness update"
  (user, 2026-11-01). So the plan adds `src/commands/harness/` (the `harness` group and `update`)
  next to `src/commands/init/`.
- The harness's own logic lives in `src/modules/harness/`, which both commands import: the plan of
  files it writes, their templates, the config defaults, the merge and the staging. Answered with
  the option "modules/harness/ ngay từ đầu" (user, 2026-11-01).
- What wires harness into init stays in `src/commands/init/`: the `--harness` and harness flags in
  `init.command.ts`, the rule that they need `--harness` in `init.service.ts`, and the calls from
  preflight and plan. The test for where a file goes: if changing init's flags would change it, it
  belongs to the command; if it is harness itself, it belongs to the module.
- `src/modules/` is a new layer between commands and core: `cli.ts` → `commands/` → `modules/` →
  `core/`. A module knows the business of one feature and nothing of the command line: no
  commander, no clack, no output, no import from a command, and modules do not import each other.
  `core/` stays infrastructure and imports no module.
- This amends decision 0024 and needs, in `tests/support/architecture-rules.ts`, role suffixes for
  `modules/<name>/` and one rule with a negative fixture for each boundary above. The node preset
  stays in `src/commands/init/` until a second command needs it.

## Hooks: the prototype's shim, a hook-only bundle (2026-11-01)

> "OK, tức là vẫn giữ `.harness/bin/harness-hook.mjs`, nhưng nội dung bên trong file đó chỉ bao
> gồm logic của hook đúng k" (user, 2026-11-01)

- The call chain stays the prototype's: `.claude/settings.json` runs
  `node "$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs"`, a shim that exits 0 silently below
  Node 24 and turns every error into exit 0, then imports the hook code beside it.
- The file the shim imports holds only the hook logic, not the whole CLI. The prototype committed
  its full 160 KB CLI bundle (`.harness/bin/harness.mjs`, its decision 0011); here tsdown builds a
  second entry from `src/modules/harness/`, and init writes it as a managed file.
- Two files, not one: the shim must parse on any Node, while the hook code targets Node 24, so an
  old Node would fail on parsing before a version check inside the same file could run.
- The code stays in the repository so a teammate without `jss-devtools` installed still gets the
  hooks; calling the installed CLI from the hook was rejected for that reason.

## `--harness` runs inside the init flow (2026-10-31)

> "Giờ flag --harness thì mình hiểu rằng là trong code, mình xử lý thêm phần harness, nếu các bước
> trước đó exit 1 (tức là toàn bộ flow của init) thì có nhận flag harness cũng không có tác dụng gì"
> (user, 2026-10-31)

- `--harness` has no flow of its own. It adds work to the init flow decided in
  [0030](../../decisions/0030-init-node-preset.md); when init exits 1 at any step, the harness
  part never runs.
- Harness checks join init's preflight, so every failure still comes before the first write.
- A repository init already set up exits 1 on its owned configs today, so it gets no harness unless
  `-f`. Accepted as the rule's consequence, not a defect.
- Installing harness without the toolchain (open question H11) is out of this plan.
- The "Nothing to change" early return must count harness entries, or the flag is dropped silently.

## Harness is on by default, AgentKit is off (2026-11-01)

> "--harness trong command init giá trị default là true. --agent-kit gía trị default là false."
> (user, 2026-11-01)

- `jss-devtools init` installs the toolchain and the harness. `--no-harness` installs the toolchain
  only; the flag is spelled `--no-harness` ("Approve, có flags `--no-harness`", user, 2026-11-01). This changes init's current default, so the tests and docs of decision 0030 change with it.
- The rule of the next section now reads: a harness flag passed with `--no-harness` exits 1 before
  any write, for example `--no-harness --agent-kit`.
- `--help` states both defaults.

## `--agent-kit` follows the prototype's decision 0013 (2026-11-01)

> "Agent kit bản chất chỉ là 1 bộ kit cho agent code ... là bản trả phí ... không phải MIT, nên
> default mình tắt nó ... có vài chỗ trùng với harness repo ... như docs, plans, decisions,... nên
> mới sinh ra "Variant file"" (user, 2026-11-01)
>
> "Giữ nguyên 0013 á, còn nội dung files thì xem xét lại, xem xét thêm tí sao cho câu văn, ý, mô tả
> đúng thứ mình muốn, ngắn gọn,..." (user, 2026-11-01)

The prototype's 0013 (`.harness/decisions/0013-agent-kit-integration-is-folders-only.md`) carries
unchanged:

- AgentKit on means `ak init --docs-dir .harness/docs --plans-dir .harness/plans`. The variant
  files the prototype also wrote are dropped (see "No variant files" below).
- Preflight exits 1 when `--agent-kit` is passed and `ak` is missing. Harness never installs a kit
  and never detects `ak` on the machine, so the result is the same on every machine.
- AgentKit off: harness owns plans, in `.harness/plans/active/`, moved to `completed/` when done.
- The contents of every file harness writes are rewritten, not copied from the prototype: each
  sentence must say what the user means, and say it briefly. The plan reviews them with the user.

## Every `.harness/` README is an index, loaded on demand (2026-11-01)

> "Trong .harness/**/*.README.md đóng vai trò như index vậy đó nha, cơ bản là ưu tiên ngắn gọn,
> cần thì load" (user, 2026-11-01), pointing at the prototype and its test repository
> `~/Desktop/test-harness`.

- Knowledge is reached in layers, each loaded only when the one above points to it: the `CLAUDE.md`
  block (every session; which kind of knowledge goes where), `MEMORY.md` and the titles of the
  decisions still in force (injected at session start, as the prototype's
  `src/hooks/session-start-hook.ts` does), each directory's `README.md` index, then the file.
- A README holds only a one-line purpose, the template to start from, and an index table with one
  row per file. Nothing else: the rules for writing a file live in its template.
- An agent adds or removes the row in the same change as the file.
- Drift between an index and its directory (a file without a row, a row without a file, as the
  prototype's `src/core/decision-index.ts` reports) is warned at session start, next to the memory
  size warning. `doctor` checks the machine, not the repository (commit `0a96a55`), so it does not
  carry this check.

## What the plan added, reviewed by the user (2026-11-01)

The plan [261101-0204-init-harness](../261101-0204-init-harness/plan.md) listed six points the
decisions implied but did not say. The user's answers:

- The hook entry is `src/modules/harness/harness-hook.entry.ts`, a new `.entry.ts` role: the
  user found `src/hook.ts` unclear ("ai biết nó là gì, hook.ts là hook của ai") and chose this name.
  Only a `*.entry.ts` may read stdin, print and set the exit code inside a module.
- The hook bundle's text is embedded in `cli.mjs`, so the release stays one file; the user
  confirmed that the installed hook code is `.harness/bin/hooks.mjs`, called by the shim.
- A harness file already present at install exits 1 unless `-f`: "OK".
- `CLAUDE.md` or `.claude/settings.json` being a symlink exits 1: "Thôi, exit 1 cho cả 2, như lúc
  nãy bạn đề xuất" (user, 2026-11-01).
- `harness update` shows its plan and asks before writing, with `-y` and `--dry-run`: "OK".
- Skill usage stays in `.harness/state/skill-usage.json` as in the prototype, which wrote it from
  each `PostToolUse` under a lock (`src/core/skill-usage.ts`); here the async hooks append to the
  session log and the Stop hook folds it into that file, so no lock is needed. Explained to the user,
  who asked how the prototype did it.
- Hooks are built before init in the phase order, because init writes the hook bundle.

## File contents, group 1, and `harness doctor` (2026-11-01)

- The `CLAUDE.md` block and the `MEMORY.md` seed in
  `plans/261101-0204-init-harness/content/` are approved, with the prototype's "Match process to
  the work" restored in a short form. The planner had cut it as Claude Code's default behavior;
  the user questioned that ("nó đã là hành vi mặc định của Anthropic claude rồi hả"), no source
  confirms it, and weaker models run in Claude Code too.
- `jss-devtools harness doctor` joins this plan (now phase 7): "Đưa doctor vào plan này" (user,
  2026-11-01). It checks the installed harness from outside the hooks, chiefly that the hooks are
  still wired, sharing every check function with the SessionStart hook and `update`.

## No variant files (2026-11-01, supersedes keeping them)

> "không cần cố phân biệt variant file với agent kit ở khắp mọi nơi, mà chủ yếu là nói agent kit sở
> hữu/làm theo các skill của agent kit thôi, tại vì cơ bản agent kit trong ngữ cảnh của project này
> là config lại path cho agent kit skill thôi" (user, 2026-11-01)

Answered with the option "Bỏ variant ở mọi nơi (Recommended)".

- Every harness file has one copy. A line about AgentKit is a condition the agent checks at run
  time: "When `ak-*` skills are present, ...". This covers the `CLAUDE.md` block and the docs,
  plans and templates READMEs.
- `--agent-kit` only runs `ak init --docs-dir .harness/docs --plans-dir .harness/plans`; it changes
  no file the harness writes. The manifest records nothing about AgentKit, and turning AgentKit on
  after the install needs no harness change.
- This departs from the prototype's 0013, which wrote the AgentKit note only with the flag.
- Narrowed on 2026-11-02 to the folder READMEs: see "The CLAUDE block follows AgentKit" below.

## With AgentKit, the harness defers to it; paths stay fixed (2026-11-01)

> "ý tôi muốn phó thác toàn bộ cho ak nếu có mặt ak" ... "chỉ nên dừng lại ở kiểu như là `follow
> its skills` thôi, bỏ việc `not this index`, `not this file` đi, vì ... harss vs agentkit dùng
> chung folder á, nếu phủ định vậy sẽ có thể gây hiểu lầm cho agent." (user, 2026-11-01)

- Every AgentKit line reads "When `ak-*` skills are present, AgentKit owns ...: follow its
  skills." No negation: harness and AgentKit share `.harness/docs/` and `.harness/plans/`.
- The paths stay fixed constants in code, passed to `ak init`; no `docsDir` or `plansDir` key in
  `config.json`: "Approved cho ý "đường dẫn cố định"" (user, 2026-11-01).
- The index drift check skips `docs/` when AgentKit is in use, since AgentKit's files there
  need no harness index row; `decisions/` is always checked.
- Group 2 of the file contents (the READMEs and both `BOOTSTRAP.md` copies) is approved with this
  wording.

## Every service lives in a `services/` folder (2026-11-01)

> "Gom / gộp thành src/{commands/modules}/<command_name>/services/<service_name>.service.ts, có lẽ
> codebase đang flollow từ src/commands/doctor/doctor.serice.ts, đó là edge case vì command doctor
> chỉ có 1 mình doctor.service.ts" (user, 2026-11-01)

- The root of a command folder holds only `.command.ts`; the root of a module folder only
  `.entry.ts`. Services go to `services/`, doctor included: "Chuyển luôn, không ngoại lệ
  (Recommended)" (user, 2026-11-01). Phase 6 of the harness plan moves them and amends 0024.

## Skills approved; the last curation is committed (2026-11-01)

- Group 4, the three `harness-*` skills in `plans/261101-0204-init-harness/content/.claude/skills/`,
  is approved: "Duyệt theo ý bạn" (user, 2026-11-01).
- The last curation is shared, as in the prototype: answered "Được, commit chung (Recommended)"
  (user, 2026-11-01). The Stop hook writes `.harness/curator.json` when the session used
  `harness-curate`; the user commits it. Counted per machine, every teammate would be asked to
  curate the same shared files each interval. Skill usage stays per machine under `state/`.
- Archiving stays a proposal the user accepts; there is no `curate` subcommand.
- Curation is also due when memory passes the session-start warning ratio, at most once a day, as
  in the prototype: "Thêm như H0 (Recommended)" (user, 2026-11-01). No new config key.

## Templates approved; learned skills carry no prefix (2026-11-01)

- Group 3 of the file contents, the six templates in
  `plans/261101-0204-init-harness/content/.harness/templates/`, is approved: "approve theo các
  convention bạn đề xuất" (user, 2026-11-01). They drop `last-verified`, keep the secret rule only
  in the `CLAUDE.md` block and the runbook, and move the plan format into `templates/plan.md`.
- A learned skill's name says what it does, with no prefix, and never starts with `ak-` or
  `harness-`; `metadata.harness-origin: learned` is what marks it. Answered with the option "Không
  tiền tố, dùng metadata (Recommended)", over `learned-*` and `harness-learned-*`, because
  `harness-*` means "managed, replaced by update, do not edit", and curation, the usage count and
  `doctor` all read the frontmatter.

## Onboarding does not commit (2026-11-01)

Answered with the option "Không commit, liệt kê file (Recommended)" (user, 2026-11-01), against
the prototype, whose onboarding committed `chore(harness): complete onboarding`.

- `harness-onboard` ends by listing every file it wrote and the deletion of `.harness/BOOTSTRAP.md`,
  and tells the user to commit them so teammates are not asked to onboard again.
- No harness step commits: not the CLI, not onboarding, review or curation.

## Harness flags depend on `--harness` (2026-10-31)

> "mọi flags khác tuỳ dps bởi --harness, không thì không có tác dụng gì" (user, 2026-10-31)
>
> "Exit 1 á, giống ý bạn đề xuất lúc nãy." (user, 2026-10-31)

- Every harness flag (the set is not decided; `--agent-kit` is the example) needs `--harness`.
- Without `--harness`, such a flag exits 1 before any write, naming the flag and the next step, for
  example `--agent-kit requires --harness` with the command rerun with `--harness`.
- Commander has no `requires`, so the rule lives with the other argument rules in
  `src/commands/init/init.service.ts`.
- A flag that needs an outside tool (`ak` for `--agent-kit`) checks for it in preflight; a failure
  of the tool after the writes is handled like an install failure, with `To finish:` commands.

## `.harness/config.json` holds the harness settings (2026-11-01)

> "Có thể sẽ có file .harness/config(s).yml|json, để lưu 1 số config." (user, 2026-10-31)
>
> "config.json dùng để lưu các giá trị default của harness thôi, config ý là giống như setings.json
> á, nhưng thôi dùng config đi. Ví dụ số lần công việc trùng lắp để harness tự tạo skill mới là 8
> lần hay 10 lần." (user, 2026-10-31)
>
> "Giá trị default trong code, từ code đó mới build ra file .harness/config.json với các giá trị
> default là 6. Bản sau nên lên 10 trong code, update sẽ sinh file default là 10, user muốn hạ
> xuống 6 thì sửa thủ công trong file, harness hoạt động vẫn đọc trong file config, vẫn là 6"
> (user, 2026-11-01)

- One JSON file, `.harness/config.json`, committed, owned by the user. JSON because the hooks read
  it with `JSON.parse` and carry no parser.
- The defaults live in the harness code; init writes every key with its default. At run time the
  harness reads only the file, never the defaults in code.
- What the CLI writes for itself (the manifest of managed files, their base copies) and the per
  machine state (counters, logs, gitignored) live elsewhere, never in this file.
- The example key (a threshold for creating a skill) is an illustration. Hermes counts tool
  iterations and user turns, not repeated work, and its review decides whether to create a skill;
  the trigger is still open question H4, and auto-created skills H9.
- `update` merges this file under decision 0001 like every other file: "Merge được thì merge, không
  được thì warn --abort|--coutinue" (user, 2026-11-01). The technique is an implementation detail
  left to the plan: key by key against the base written last time (an untouched key takes the new
  default, an edited key is kept, a new key is added, a key both sides changed to different values
  is a conflict), because a line merge can report false conflicts or leave invalid JSON.

## `update` follows the old prototype's decision 0001 unchanged (2026-11-01)

> "Tôi nhớ bản harness đang triển khai lần trước ... có quyết định như sau: update bình thường nếu
> không có xung đột, exit 1 và gợi ý --abort|--continue nếu có xung đột" (user, 2026-11-01)
>
> "Giống 0001 nguyên vẹn, tự commit sau khi update thành công, đơn giản hoá thao tác là strategy
> của thiết kế harness cũ, giờ vẫn giữ tinh thần đó." (user, 2026-11-01)

The prototype's decision 0001 (`the dokploy repository`,
`.harness/decisions/0001-update-conflicts-human-decided-install-collisions-overwrite.md`), quoting
"Agent đề xuất, người quyết":

- Without a conflict, `update` applies the change. It does not commit (see below).
- With a conflict, it stages base, local, upstream and resolved copies under `.harness/update/`,
  leaves the live files untouched, exits 1 and names `update --continue` and `update --abort`.
  The agent proposes a resolution by editing the staged files; the user decides and continues.
- Exit code 1 fits decision 0023 (codes 0 and 1 only). The prototype's codes 2 and 3 do not carry.
- How a text file is merged (managed skills, templates, the `CLAUDE.md` block) and how the staging
  folder is laid out are implementation details for the plan, within this rule; `config.json` is
  merged key by key (see its section).
- The prototype's edge cases carry over (its `src/updater/planner.ts`, `run-core-update.ts`): a
  deleted managed file is a conflict, not recreated; a file dropped upstream is deleted when
  untouched and a conflict when edited; a downgrade is refused; a missing base exits with "restore
  from git"; `--continue` refuses staged files that still hold conflict markers or block markers;
  a lock keeps two updates from running at once.
- The hook bundle `.harness/bin/hooks.mjs` is minified build output, so it is always overwritten,
  never merged, as the prototype did with its bundle. Nobody edits it by hand.

### What `harness update` covers (2026-11-01)

Answered "OK" (user, 2026-11-01) to this scope:

- It updates everything the harness installed: managed files by three-way merge, the hook bundle
  by overwrite, the `CLAUDE.md` block, the harness entries in `.claude/settings.json` (other hooks
  kept), `config.json` key by key, then rewrites the manifest and base.
- It never touches seeds (`MEMORY.md`, `BOOTSTRAP.md`, `decisions/`, `docs/`), learned skills,
  `.harness/archive/`, or the toolchain `init` installed. The prototype's manifest also only
  recorded toolchain versions (`src/updater/provenance.ts`).
- The new content is the templates inside the installed `jss-devtools`; `update` downloads nothing.
  The user updates the CLI through `install.sh`, then runs `harness update`.

### A missing key or invalid `config.json` (2026-11-01)

Answered with the option "Cảnh báo, update tự vá (Recommended)" (user, 2026-11-01).

- A hook that finds its key missing skips that feature, never crashes, and the SessionStart hook
  warns with the command that repairs it. The hooks still read only the file, never the defaults
  in code.
- `harness update` treats a missing key as not set and writes it back with the current default,
  instead of keeping it deleted as a key-by-key merge otherwise would.
- Invalid JSON makes `update` exit 1 in preflight, before any write, naming the line of the error.

### The CLI never commits (2026-11-01, supersedes the auto-commit above)

> "Tôi vừa kiểm tra lại jss-devtools init mới, sau khi tạo chưa commit gì, thôi thì nếu update thì
> cũng không commit luôn nha" (user, 2026-11-01)

- `init`, `init --harness` and `update` write files and never commit; the user commits. This
  matches what `init` does today and the prototype's 0017 for review and curation.
- So `update` needs no git identity and no clean tree in its preflight, the same as `init`.
- The `update` outro suggests no commit command, the same as `init`. The user first answered "Có",
  then reversed: "đổi ý lại - không outro không gợi ý commit" (user, 2026-11-01).

## The harness design proposal is accepted with three changes (2026-11-01)

> "Chấp nhân như những gì bạn nói, những gì tôi không nói là chấp nhận của bạn. không chặn chặn
> model tự gọi trong một số trường hợp không, đổi ý lại - không outro không gợi ý commit, File
> variant giữ lại đi - do tôi chưa nói rõ với bạn về agent-kit, tôi sẽ nói sau." (user, 2026-11-01)

[design-proposal.md](./design-proposal.md) is accepted as written, with these changes:

- No skill sets `disable-model-invocation`; every harness and learned skill stays invocable by the
  model.
- The `update` outro suggests no commit command (above).
- The prototype's variant files stay. Superseded by "No variant files" below.

## Config defaults for a medium project (2026-11-02, supersedes H0's values; `review.minToolCalls` and `memory` superseded by "Defaults from real use" below)

> "Tôi thấy context 3000 char có vẻ ít, tôi sợ ít." and "Chốt 7 / 4800 / 300 / 10 / 7 / 14 / 28,
> lên plan thôi, không giao cooker." (user, 2026-11-02)

- Defaults: `review.minToolCalls` 7, `memory.maxChars` 4800, `memory.maxEntryChars` 300,
  `curator.minLearnedSkills` 10, `curator.intervalDays` 7, `curator.staleDays` 14,
  `curator.archiveDays` 28.
- 4800 holds sixteen entries of 300 chars, and the 80% warning starts at 3840; memory stays an
  index of non-obvious traps, with decisions, skills and docs holding the rest.
- 28 days is four curation intervals and twice `staleDays`, so a skill turns stale and then
  archivable on a curation boundary.
- `harness update` adds missing keys and keeps existing values, so repositories already installed
  keep their numbers; only new installs get these.
- Plan: [261102-1045-harness-config-defaults](../261102-1045-harness-config-defaults/plan.md).

## Review threshold 10 (2026-11-03, supersedes `review.minToolCalls` 7 above; superseded by "Defaults from real use" below)

> "Chốt: minToolCalls 10 nhé." (user, 2026-11-03)

- `init` writes `review.minToolCalls: 10`. From the long-chain eval
  ([eval-261103-0154-harness-long-chain](../../../jss-harness-eval/plans/reports/eval-261103-0154-harness-long-chain.md)):
  a review-written decision carried to every later session at both 7 and 14 (20/20, baseline 5/20),
  while 14 asked for 11 of 20 reviews against 20 of 20 at 7. 10 sits between the two measured
  values; a failed tool call still always asks for a review.
- Repositories already installed keep their value: `harness update` adds missing keys and keeps
  existing ones.

## The CLAUDE block follows AgentKit (2026-11-02, narrows "No variant files")

> "trong `decision-log.md:155` tôi confirm là có quyết định, nhưng tôi và bạn đã hiểu sai 1 chút.
> Trong ngữ cảnh lúc đó, bạn thảo luận là lập plan cùng tôi, có quá nhiều files variant, gần như cho
> tất cả như .harness/{decisions/docs/plans/templates}/README.md,... nên tôi mới bảo thế." and
> "Chọn 1, detect, nhưng quyết định này khá quan trọng / magic, nên docs rõ lại." (user, 2026-11-02)

> "2 vì khi init với --agent-kit, behaivior là ak init. Như vậy dựa vào ak đó, suy ngược lại."
> (user, 2026-11-02)

- "No variant files" means the folder READMEs. The `CLAUDE.md` block varies with AgentKit; the
  READMEs carry no AgentKit line.
- `init` reads `--agent-kit`; `harness update` detects AgentKit by `.agentkit/config.yaml`, the
  file `ak init` writes and the project commits. The manifest still records nothing about
  AgentKit. A recorded setting was rejected.
- With AgentKit the block says AgentKit owns `.harness/{docs,plans}/` and works in
  `.harness/decisions/`, because the hooks read decision file names, `status` and index rows.
- `ak-*` stays in the wording: "khi `ak-*` skills thay đổi, mình sẽ maintenance theo ak".
- One "do not edit what an update replaces" rule, one line per updater, one shared correction route.
- No learned-skill marker line: the `## Where knowledge goes` table already routes learned skills
  to `.harness/templates/skill.md`.
- Documented in `docs/decisions/0034-claude-block-follows-agentkit.md` by the plan.
- Plan: [261102-1247-scaffold-touchups](../261102-1247-scaffold-touchups/phase-03-agentkit-wording.md).

## Defaults from real use (2026-11-09, supersedes `review.minToolCalls` 10 and `memory` 4800 / 300 above)

> "Sau khi làm việc thực tế với \"harness\", tôi đề xuất sửa config …" and "Dùng 14, 9600, 320 luôn, commit, push
> không bump version." (user, 2026-11-09)

- `init` writes `review.minToolCalls` 14, `memory.maxChars` 9600, `memory.maxEntryChars` 320; the curator values stay.
- Source: a design-system repository running the harness through its reset, where these values were tuned by hand.
- `harness update` keeps a project's existing values; only missing keys take the new defaults.
