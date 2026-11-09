# Cooker report — Fix xung đột plan-path trong CLAUDE.md khi có AgentKit

Status: **DONE**

Summary: Đã tham số hoá `agentKit` cho các template liên quan plan, nên repository cài harness
**với AgentKit** không còn dạy đường dẫn `plans/active/` + `completed/` (vốn mâu thuẫn với dòng
"AgentKit owns `.harness/{docs,plans}/`" ngay trong cùng block CLAUDE.md). Nhánh `agentKit=false`
giữ **byte-for-byte** y hệt trước fix (chứng minh bằng snapshot sinh **trước** khi sửa code).
**Refinement vòng 3:** với `agentKit=true`, block CLAUDE.md **xoá hẳn** hàng "Work spanning sessions";
bullet "Work spanning sessions: a plan, …" đổi thành "as the skill that owns the plan folder says".
**Mở rộng vòng 4 (áp cùng nguyên lý cho CẢ HAI README):** với `agentKit=true`, **không README nào
còn dạy một plan path nào** — `.harness/plans/README.md` chỉ còn mô tả thư mục plan, câu "The plan
skill that owns this folder decides the layout" và nhiệm vụ mục lục (thêm/xoá hàng cùng lúc với file);
`.harness/templates/README.md` không còn trỏ `../plans/<YYMMDD>-<HHMM>-<slug>/` mà trỏ plan skill,
và cột "Index to update" của hàng plan là `../plans/README.md`. Lý do ghi trong ADR 0035: ngoài DRY với
bullet sở hữu, hook AgentKit inject đường dẫn/naming plan thật vào mỗi phiên (đã kiểm chứng ở
`~/.claude/hooks/lib/context-builder.cjs`), nên path tĩnh trong harness file là rủi ro drift.
**Vòng 5 (planner duyệt concern về kind):** `.harness/plans/README.md` đổi kind theo **quyền sở hữu
nội dung** — nhánh `agentKit=false` giữ `managed` (nội dung tool soạn, harness sở hữu), nhánh
`agentKit=true` thành `seed` (mục lục do plan skill duy trì, repo sở hữu) → không còn nằm trong
manifest, `harness update` không ghi đè hay conflict. Kèm cơ chế **bàn giao hai chiều** cho repo đã
cài bản cũ (file từng managed) và repo đổi setting. Toàn bộ chuỗi `pnpm format:check && pnpm lint
&& pnpm typecheck && pnpm test && pnpm build` xanh. Chưa commit, chưa push.

## Files đã tạo

| Path | Nội dung |
| --- | --- |
| `src/core/utils/markdown-table.util.ts` | `markdownTable(header, rows)`: dựng bảng Markdown canh theo ô dài nhất, đúng cách Prettier canh — dùng cho bảng trong CLAUDE.md block và templates README. Không thể để padding do con người gõ: `tests/harness-markdown-format.test.ts` đòi mọi file Markdown cài đặt phải **đã** ở dạng output của Prettier, mà mỗi nhánh `agentKit` có độ rộng cột khác nhau |
| `tests/__snapshots__/harness-install-plan.service.test.ts.snap` | Snapshot nhánh `agentKit=false`, **sinh trước khi sửa code** (lệnh `vitest -u` lúc đó) — đây là bằng chứng "nhánh false bất biến", không phải snapshot tự chứng minh |
| `docs/decisions/0035-plan-paths-follow-the-agentkit-setting.md` | ADR: với AgentKit, harness **không dạy plan path nào**; block bỏ hàng plan, hai README không dạy path, không README nào nêu tên AgentKit. `supersedes: none`: 0034 **không** bị sửa, 0035 chỉ vô hiệu hoá câu "the folder READMEs have none" của nó. **Vòng 3 sửa tại chỗ** (block bỏ hàng plan), **vòng 4 sửa tiếp** (hai README không dạy path; thêm lý do "hook inject đường dẫn plan thật mỗi phiên → path tĩnh là rủi ro drift"; title đổi thành "with AgentKit the harness teaches no plan path, the plan skill decides the layout") |


## Files đã sửa

| Path | Thay đổi |
| --- | --- |
| `src/modules/harness/templates/claude-block.template.ts` | Bảng "Where knowledge goes" dựng bằng `markdownTable`. Hàng "Work spanning sessions" chỉ có khi `agentKit=false` (`: false` → `` `.harness/plans/active/<YYMMDD>-<slug>.md` `` + "Start from" = `` `.harness/plans/README.md` ``, y hệt cũ; `: true` → **không có hàng nào**). Bullet "Work spanning sessions: a plan, …" trong "Match the process to the work" đổi theo: `false` giữ "as the table above says"; `true` → "as the skill that owns the plan folder says" |
| `src/modules/harness/templates/harness-seeds.template.ts` | `harnessPlansReadmeTemplate` thành function nhận `agentKit`. Nhánh `false` giữ nguyên văn cũ (`active/`, `completed/`, `git mv`). **Vòng 4:** nhánh `true` bỏ hẳn mọi path/ngày/`active`/`completed`/`reports/` — chỉ còn mô tả thư mục chứa plan, câu "The plan skill that owns this folder decides the layout", nhiệm vụ mục lục và bảng index rỗng |
| `src/modules/harness/templates/harness-template-files.template.ts` | `harnessTemplatesReadmeTemplate` và `harnessPlanTemplateTemplate` thành function nhận `agentKit`. **Vòng 4:** hàng plan trong bảng templates (nhánh `true`) không còn trỏ `../plans/<YYMMDD>-<HHMM>-<slug>/` mà trỏ "the plan the plan skill writes", cột "Index to update" là `../plans/README.md`; các hàng khác giữ nguyên. Template plan vẫn defer (nhánh `true` giữ nguyên như lượt trước) |
| `src/modules/harness/services/install-plan.service.ts` | Truyền `input.agentKit` vào `harnessPlansReadmeTemplate`, `harnessTemplatesReadmeTemplate`, `harnessPlanTemplateTemplate`. **Vòng 5:** kind của `.harness/plans/README.md` theo quyền sở hữu nội dung (`plansReadmeKind`): `false` → `managed`, `true` → `seed`; thêm `harnessSeedRefreshes()` trả nội dung seed mà release nhận ra |
| `src/modules/harness/types/update.type.ts` | Thêm `HarnessSeedFile` và `HarnessRelease.seeds` (nội dung seed mà release nhận ra, để bàn giao file hai chiều) |
| `src/modules/harness/services/update-release.service.ts` | Release mang `seeds` (nội dung seed của plans README) |
| `src/modules/harness/services/update-plan.service.ts` | **Vòng 5:** xử lý bàn giao hai chiều cho `.harness/plans/README.md`: (a) file rời khỏi tập managed (seed) → file chưa sửa thì lấy nội dung seed, file đã sửa thì giữ nguyên, **không** conflict, **không** delete; (b) file vào tập managed mà repo vẫn giữ đúng nội dung seed → harness tiếp quản, không conflict |
| `tests/harness-install-plan.service.test.ts` | (1) Snapshot nhánh `false`; (2) test nhánh `true`: không còn `plans/active`/`completed/` ở block CLAUDE.md, plans README, templates README, templates/plan.md; assert hàng plan vắng mặt và bullet sở hữu còn nguyên; (3) sửa test "puts the AgentKit lines … only when AgentKit is on" — so hai block sau khi bỏ hàng plan và bullet plan ở cả hai bên; (4) vòng 4: test mới "teaches no plan path in either README when AgentKit is on"; **(5) vòng 5: test mới "gives the plans README to the repository when AgentKit is on, and keeps it managed otherwise"** — kind `seed`/`managed` và manifest có/không có path |
| `tests/harness-update.test.ts` | Test luồng `harness update`: repo có `.agentkit/config.yaml` → sau update, các file plan mang biến thể AgentKit và CLAUDE.md **không còn hàng plan**. **Vòng 5 thêm 3 test:** (a) repo AgentKit có hàng index agent thêm → update **không** ghi đè, **không** conflict; (b) plans README đã sửa khi thành seed → giữ nguyên và rời khỏi manifest; (c) plans README chưa sửa khi thành seed → lấy nội dung seed hiện tại và rời khỏi manifest |
| `docs/codebase-summary.md` | Thêm hàng `src/core/utils/markdown-table.util.ts` vào cây file "file by file". Sửa **thêm** trên thay đổi chưa commit của plan landing-site, không đụng các dòng có sẵn |
| `docs/project-roadmap.md` | Câu "decides the `CLAUDE.md` block variant, changing no other harness file" nay sai (hai README + plan template cũng có biến thể theo `agentKit`) → sửa câu đó và thêm link 0035. Không sửa 0034 |

## Lệnh đã chạy và output thật

### 1. Chụp baseline nhánh `agentKit=false` **trước** khi sửa code

```
$ pnpm exec vitest run tests/harness-install-plan.service.test.ts -u
 ❯ tests/harness-install-plan.service.test.ts (15 tests | 1 failed)
   Snapshots  1 written
 Test Files  1 failed (1)
      Tests  1 failed | 14 passed (15)
```

Snapshot ghi ra đúng nội dung block CLAUDE.md + plans README + templates README + template plan
của nhánh `false` (pre-fix). Test `true` fail đúng như mong đợi (pre-fix còn dạy `plans/active`).

### 2. Sau khi sửa: snapshot `false` **không đổi** (bất biến), test `true` xanh

```
$ pnpm exec vitest run tests/harness-install-plan.service.test.ts tests/harness-markdown-format.test.ts
 Test Files  2 passed (2)
      Tests  17 passed (17)
```

`harness-markdown-format.test.ts` xanh nghĩa là cả hai nhánh đều đã ở dạng output của Prettier.

### 3. Luồng `harness update` với repo có AgentKit

```
$ pnpm exec vitest run tests/harness-update.test.ts
◇  Changes in jss-devtools-KnGI6A: 4 to update
│  ~ .harness/plans/README.md
│  ~ .harness/templates/plan.md
│  ~ .harness/templates/README.md
│  ~ CLAUDE.md
 Test Files  1 passed (1)
      Tests  36 passed (36)
```

### 4. Chuỗi kiểm tra đầy đủ

```
$ pnpm lint
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
(không output — pass)

$ pnpm typecheck
$ tsc --noEmit
(không output — pass)

$ pnpm test
 Test Files  30 passed | 1 skipped (31)
      Tests  475 passed | 7 skipped (482)
   Duration  6.29s

$ pnpm build
✔ Build complete in 13ms        (dist/hooks.mjs 27.11 kB)
✔ Build complete in 29ms        (dist/cli.mjs 335.31 kB)
```

### 5. Vòng 2: ADR 0035 + docs (sau khi stash `landing-site-hello-world-wip` đã pop, `docs/` mở lại)

```
$ pnpm exec prettier --check docs/codebase-summary.md docs/decisions/0035-plan-paths-follow-the-agentkit-setting.md
Checking formatting...
[warn] docs/decisions/0035-plan-paths-follow-the-agentkit-setting.md
[warn] Code style issues found in the above file. Run Prettier with --write to fix.
```
→ `prettier --write` trên ADR (bảng Markdown phải đúng dạng Prettier) và trên
`docs/codebase-summary.md` (hàng mới cần padding đúng).

```
$ pnpm format:check
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!

$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
 Test Files  30 passed | 1 skipped (31)
      Tests  475 passed | 7 skipped (482)
   Duration  6.12s
✔ Build complete in 11ms        (dist/hooks.mjs 27.11 kB)
✔ Build complete in 27ms        (dist/cli.mjs 335.31 kB)
```

### 6. Vòng 3: refinement — xoá hẳn hàng plan khi `agentKit=true`

```
$ pnpm exec vitest run tests/harness-install-plan.service.test.ts tests/harness-update.test.ts tests/harness-markdown-format.test.ts
 Test Files  3 passed (3)
      Tests  53 passed (53)

$ pnpm format:check
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!

$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
 Test Files  30 passed | 1 skipped (31)
      Tests  475 passed | 7 skipped (482)
   Duration  6.32s
✔ Build complete in 13ms        (dist/hooks.mjs 27.11 kB)
✔ Build complete in 27ms        (dist/cli.mjs 335.45 kB)
```

### 7. Vòng 4: mở rộng — không README nào dạy plan path khi `agentKit=true`

```
$ pnpm exec vitest run tests/harness-install-plan.service.test.ts tests/harness-update.test.ts tests/harness-markdown-format.test.ts
 Test Files  3 passed (3)
      Tests  54 passed (54)

$ pnpm format:check
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!

$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
 Test Files  30 passed | 1 skipped (31)
      Tests  476 passed | 7 skipped (483)
   Duration  7.05s
✔ Build complete in 8ms         (dist/hooks.mjs 27.11 kB)
✔ Build complete in 28ms        (dist/cli.mjs 335.39 kB)
```

Hai lần phát hiện trong lượt này, đã sửa: bảng rỗng trong plans README phải có delimiter row canh
theo độ rộng header (`| ---- | ------ | ------- |`) để Prettier giữ nguyên; assert "the plan skill
that owns this folder" phải viết hoa chữ `T` vì câu đứng đầu câu.

Nội dung sinh ra với `agentKit=true` (đã kiểm tra trực tiếp):

```
# Plans

Work that spans sessions. The plan skill that owns this folder decides the layout: a plan is a
folder with its plan and its phase files.

Keep this file the index of the folder: add or remove a row in the same change as the plan.

| Plan | Status | Summary |
| ---- | ------ | ------- |
```

```
| [plan.md](./plan.md)                           | the plan the plan skill writes   | `../plans/README.md`     |
```

### 8. Vòng 5: kind của plans README theo quyền sở hữu nội dung

```
$ pnpm exec vitest run tests/harness-install-plan.service.test.ts tests/harness-update.test.ts tests/harness-markdown-format.test.ts
 Test Files  3 passed (3)
      Tests  57 passed (57)

$ pnpm format:check
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!

$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
 Test Files  30 passed | 1 skipped (31)
      Tests  480 passed | 7 skipped (487)
   Duration  7.11s
✔ Build complete in 23ms        (dist/hooks.mjs 27.11 kB)
✔ Build complete in 27ms        (dist/cli.mjs 337.07 kB)
```

Hai lỗi đã gặp và sửa trong lượt này:

- `manifestEntryOf` trả về `null` (không phải `undefined`) cho path không có trong manifest → nhánh
  "file vào tập managed" ban đầu không chạy, update báo conflict `unmanaged file in a managed path`.
  Sửa: so với `null`.
- Đổi kind làm file **rời khỏi** release (nó là seed) → `decideWholeFile` với `upstream === null` sẽ
  **xoá** file trong repo đã cài bản cũ (local === base) hoặc báo conflict (local ≠ base). Sửa: release
  mang `seeds`, và `update-plan` xử lý riêng trường hợp file rời khỏi tập managed — file chưa sửa thì
  lấy nội dung seed, file đã sửa thì giữ nguyên, không conflict, không delete.

Block sinh ra khi `agentKit=true` (đã kiểm tra trực tiếp output): bảng "Where knowledge goes" còn
đúng 4 hàng, **không** có "Work spanning sessions"; bullet "- AgentKit owns `.harness/{docs,plans}/`"
là nơi duy nhất nói về plan; bullet trong "Match the process to the work" là
"- Work spanning sessions: a plan, as the skill that owns the plan folder says."

## Đối chiếu acceptance criteria

| AC | Kết quả | Bằng chứng |
| --- | --- | --- |
| 1. `agentKit=true`: không còn `plans/active`/`completed/` ở block CLAUDE.md, plans README, templates/plan.md; mô tả đúng layout timestamped | **Đạt** | Test "teaches the AgentKit plan layout …" + test update-flow; đã kiểm tra tay output sinh ra (plans README, templates README, template plan, CLAUDE.md) |
| 2. `agentKit=false`: output giống hệt trước fix | **Đạt** | Snapshot sinh **trước** fix còn nguyên sau fix; `pnpm test` xanh |
| 3. Test phủ cả hai nhánh, có assert âm định dạng (`plans/active` vắng mặt khi `agentKit=true`) | **Đạt** | `tests/harness-install-plan.service.test.ts` (2 test mới) + `tests/harness-update.test.ts` (1 test mới) |
| 4. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` xanh | **Đạt** | Mục 4 ở trên |
| 5. (vòng 3) `agentKit=true`: hàng "Work spanning sessions" **không còn** trong bảng của block; bullet sở hữu còn nguyên; bullet "Work spanning sessions: a plan, …" trỏ về skill sở hữu plan folder, không hard-code tên skill | **Đạt** | Assert `not.toMatch(/^\| Work spanning sessions/m)` + assert nội dung bullet mới trong `tests/harness-install-plan.service.test.ts`; kiểm tra trực tiếp block sinh ra |
| 6. (vòng 3) Nhánh README plans + `templates/plan.md` giữ nguyên như lượt trước | **Đạt** | Không sửa `harness-seeds.template.ts` / `harness-template-files.template.ts` ở vòng 3; các test của hai file này vẫn xanh |
| 7. (vòng 4) `agentKit=true`: **không README nào dạy plan path** — plans README không còn path/ngày/`active`/`completed`/`reports/`, chỉ còn mô tả thư mục + "The plan skill that owns this folder" + nhiệm vụ mục lục; templates README không còn trỏ `../plans/<YYMMDD>-<HHMM>-<slug>/` | **Đạt** | Test mới "teaches no plan path in either README when AgentKit is on"; đã kiểm tra trực tiếp output sinh ra |
| 8. (vòng 4) `templates/plan.md` giữ nguyên (đã defer); test "mentions AgentKit in no folder README" vẫn xanh | **Đạt** | Không sửa nhánh `true` của `harnessPlanTemplateTemplate` ở vòng 4; test "mentions AgentKit in no folder README" xanh |
| 9. (vòng 5) Kind của `.harness/plans/README.md` theo quyền sở hữu nội dung: `false` → `managed`, `true` → `seed`; seed không nằm trong manifest | **Đạt** | Test "gives the plans README to the repository when AgentKit is on, and keeps it managed otherwise" |
| 10. (vòng 5) `harness update` không ghi đè, không conflict với plans README của repo AgentKit (kể cả khi agent đã thêm hàng index); repo đã cài bản cũ (file từng managed) và repo đổi setting đều xử lý an toàn | **Đạt** | 3 test update-flow mới + test cũ "removes the AgentKit lines from a repository that lost the AgentKit config" vẫn xanh |

## Ràng buộc đã tôn trọng

- Vòng 1: không chạm `docs/`, `package.json`, `site/`, `docker/`, `ci/`, `tests/install.test.ts`,
  `tsconfig.json`, `eslint.config.mjs`, `.gitignore`, `.dockerignore`, `.github/` → không phát sinh
  BLOCKED nào.
- Vòng 1: stash `landing-site-hello-world-wip` không bị pop, không bị đụng. Vòng 2 (sau khi
  planner pop sạch stash và mở lại `docs/`): chỉ chạm `docs/decisions/0035-…`,
  `docs/codebase-summary.md`, `docs/project-roadmap.md`; **không** đụng các thay đổi chưa commit
  của plan landing-site trong `docs/codebase-summary.md` (sửa thêm, giữ nguyên phần có sẵn).
- Vòng 3: ADR 0035 sửa **trực tiếp tại chỗ** (file chưa commit, chưa release — không tạo 0036), theo
  chỉ dẫn; `docs/project-roadmap.md` sửa câu mô tả `--agent-kit` cho khớp refinement. Không chạm
  các thay đổi chưa commit của plan landing-site.
- Vòng 4: cùng cách sửa tại chỗ cho ADR 0035 và roadmap; không đụng các thay đổi chưa commit của
  plan landing-site.
- Vòng 5: ADR 0035 thêm **một câu** về quyền sở hữu file (tool soạn vs agent duy trì), không mở rộng.
- Không commit, không push.

## Concerns

1. **Đã xử lý:** câu *"the folder READMEs have none"* của
   `docs/decisions/0034-claude-block-follows-agentkit.md` không còn đúng sau fix. ADR **0035**
   (`docs/decisions/0035-plan-paths-follow-the-agentkit-setting.md`) ghi lại quyết định mới, và ở
   vòng 3 được **sửa tại chỗ** cho khớp refinement của user: với AgentKit, block **xoá hẳn** hàng
   plan, bullet sở hữu trong block là chỗ duy nhất nói về plan; hai README + plan template vẫn là
   biến thể theo `agentKit`, và **không README nào nêu tên AgentKit** — lý do gốc của 0034 được giữ
   nguyên. 0034 **không** bị sửa, **không** bị đánh dấu superseded (`supersedes: none`); 0035 chỉ vô
   hiệu hoá đúng câu đó.
2. **Đã xử lý:** `docs/codebase-summary.md` đã có hàng `src/core/utils/markdown-table.util.ts`.
3. **Hai chỗ trong `docs/decisions/0034` được test bảo vệ** (`mentions AgentKit in no folder README`,
   và phép so hai block trong `harness-install-plan.service.test.ts`) đã được giữ nguyên ý nghĩa:
   `mentions AgentKit in no folder README` vẫn xanh; phép so hai block nay bỏ hàng plan và bullet plan
   ở **cả hai** bên, nên khác biệt còn lại giữa block `true` và `false` là bullet AgentKit.
4. **Tên skill plan của AgentKit**: trong `templates/plan.md` là "the AgentKit plan skill" (skill
   `ak-plan` theo catalog cài đặt); trong block CLAUDE.md vòng 3 **không** nêu tên skill nào — câu
   "as the skill that owns the plan folder says." Tên skill cụ thể không được hard-code trong block vì
   AgentKit có thể đổi tên.
5. **Chưa kiểm chứng ngoài repo**: layout `.harness/plans/<YYMMDD>-<HHMM>-<slug>/` và thư mục
   `reports/` lấy từ chẩn đoán của plan (hook prompt + skill `ak-plan`), không từ một repo đã cài
   AgentKit thật. Nếu AgentKit đổi layout, nội dung phải theo — hiện chưa có test nào chốt layout đó.
   *(Vòng 4 giảm bớt rủi ro này: hai README không còn dạy path nào; chỉ `.harness/templates/plan.md`
   còn nêu đường dẫn file nó tạo, theo chỉ dẫn của user.)*
6. **Đã xử lý (vòng 5, planner duyệt):** mục lục trong file managed → `.harness/plans/README.md`
   nay là **seed** khi `agentKit=true`, nên `harness update` không ghi đè và không conflict với các
   hàng index agent thêm vào. Repo đã cài bản cũ (file từng managed) được bàn giao: file chưa sửa thì
   lấy nội dung seed hiện tại, file đã sửa thì giữ nguyên — không delete, không conflict.
7. **Dư lại, không chặn:** sau khi plans README rời khỏi tập managed, bản base copy cũ vẫn nằm ở
   `.harness/core/base/.harness/plans/README.md`. Nó vô hại — doctor chỉ kiểm tra base copy của các
   path trong manifest, và `readBaseCopy` chỉ được gọi cho path còn trong manifest — nhưng là file
   thừa. Xoá nó sẽ cần thêm một nhánh trong `applyUpdatePlan`, ngoài phạm vi lượt này.
8. **Hệ quả cần biết:** vì kind đổi theo setting, đổi `.agentkit/config.yaml` sẽ bàn giao file qua
   lại. Chiều seed → managed đã có test (repo mất config → update thành công, file lấy nội dung
   managed); chiều managed → seed đã có test (file chưa sửa lấy seed, file đã sửa thì giữ).
