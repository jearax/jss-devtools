# Kongming Advisory — Phase 3 Review Cleanup: GO/NO-GO + next risk

Date: 2026-08-27 · Scope reviewed: `plans/260821-1050-uninstall-command-design/phase-03-review-cleanup.md`
Verdict: **GO** — với 2 sửa hợp đồng bắt buộc + 1 mục cần ack user.

## TL;DR

Contract R1-R4 đúng hướng và đủ để triển khai. Hai chỉnh sửa bắt buộc trước khi code: (1) R4 phải dùng
`getPmLedger().lastPm` chứ không phải "pmsSeen cuối cùng" — pmsSeen là Set theo thứ tự *first-seen*,
phần tử cuối KHÔNG phải PM dùng gần nhất (`src/core/store/store.ts:89-92`, chứng minh tại
`tests/store.test.ts:45-52`); (2) R1 thiếu chi tiết call-site — cả 3 nơi gọi đều deref `result.cmdStr`
ngay sau exec (`uninstall.ts:102`, `downgrade.ts:133`, `update-shared.ts:113`) nên guard phải trả
`ExecResult | null` và mỗi call site thêm `if (!result) return` (typecheck sẽ ép narrowing — thiếu là
lỗi compile, không âm thầm). Một mục optional cần ack: gộp vào Phase 3 việc capture stdio ở `--json`
mode — vì chính spec R1 đòi "message kèm stderr context" mà `stdio:'inherit'` không capture gì,
nên không có nó thì requirement đó không đạt được ở JSON mode.

## Câu trả lời 4 câu hỏi

### Q1 — Go/no-go

**GO** sau 2 amendment:

1. **R4 hint source (bắt buộc)**: sửa plan từ "pmsSeen cuối cùng" thành `lastPm ?? 'npm'`.
   Evidence: `recordPmSeen` giữ `[...new Set([...ledger.pmsSeen, pm])]` — thứ tự insertion
   (first-seen), không phải recency. Sequence pnpm→npm→pnpm cho `pmsSeen=['pnpm','npm']` nhưng
   `lastPm='pnpm'`. Dùng pmsSeen[last] sẽ hint sai PM một cách âm thầm; `lastPm` tồn tại sẵn đúng cho
   mục đích này. File cần mổxstring: `phase-03-review-cleanup.md` dòng 44 ("Ưu tiên PM từ ledger
   (pmsSeen cuối cùng)").

2. **R1 guard signature + JSON payload shape (bắt buộc làm rõ)**:
   - Return type `Promise<ExecResult | null>`; mỗi call site thêm early-return null.
   - JSON error payload: KHÔNG dùng bare `{schemaVersion,result,error}` kiểu PM_NOT_DETECTED. Vì khi
     exec fail ta ĐÃ biết pm/command/current/target — precedent đúng là SPEC_INVALID
     (`downgrade.ts:60-70`) phát đầy context qua spread `baseResult()` + field riêng. Khuyến nghị
     mirror pattern của `confirmOrCancel`: guard nhận sẵn `failPayloadBase` (caller build bằng
     baseResult + command-specific fields), guard merge `result:'error',
     error:{code:'PM_EXEC_FAILED',message}, message` lên trên. Package chưa publish — richer free.
   - Cleanup bonus trong cùng family dead-field: `ExecResult.dryRun` và `.pm` cũng không caller nào
     đọc (chỉ `.cmdStr`). Có thể collapse interface về `{cmdStr}` hoặc trả string luôn trong một lần;
     nếu muốn zero scope thì chỉ bỏ `ok` theo spec và ghi nhận phần còn lại cho review sau.

Chưa thấy flaw nào khác trong R1-R4: mapping 1 code `PM_EXEC_FAILED` (KISS) đúng; core giữ throw-y
đúng biên layer; R2 channel-discipline đúng (chỉ human mode); R3 1 dòng.

### Q2 — Placement guard

**New sibling file `src/commands/self/utils/exec-guard.ts`**, không nhét vào `flow.ts`. Lý do:

- `flow.ts` hiện single-concern (detect boundary guard: import detector/store/pkg). Exec guard có
  dependency set khác hẳn (types từ `core/self-installer`, formatting stderr) — trộn vào làm
  flow.ts loãng concern chỉ để tiết kiệm 1 file.
- Repo habit: self/utils là bộ file nhỏ single-purpose (`args.ts`, `flow.ts`, `result.ts`,
  `update-shared.ts`) — file mới khớp pattern, và các command vốn import nhiều utils rồi.
- Rollback/granularity: R4 sửa flow.ts độc lập với R1 tạo file mới — khớp bảng risk của phase doc
  ("mỗi call site là 1 dòng revert").

Design bổ sung cho testability: guard nhận `exec: () => Promise<ExecResult>` (thunk) thay vì gọi
trực tiếp export của exec.ts — unit test pass failing-thunk không cần vi.mock module graph.

### Q3 — stdio inherit phá JSON output

Risk thật, confirmed: `exec.ts:41` `stdio:'inherit'` share fd với parent; PM success-path in ra khá
nhiều (pnpm add -g in progress table) → byte đó chen trước `logger.json` trên stdout → `| jq` gãy.

**Khuyến nghị: gộp vào Phase 3 bản minimal** — đây thực chất là hạ tầng BẮT BUỘC của chính R1:
spec R1 yêu cầu JSON error message kèm stderr context, nhưng `'inherit'` khiến execa không capture
stream (err.stderr rỗng) → không đáp ứng được requirement nếu không đổi stdio. Thiết kế nhỏ:

- `execOrDryRun(pm, verb, pkgSpec, dryRun, opts?: {capture?: boolean})`;
  `stdio: opts?.capture ? 'pipe' : 'inherit'`.
- Guard set capture khi `jsonMode && !dryRun`. Success: discard child output (im lặng là hành vi đúng
  cho máy đọc); Failure: embed `err.shortMessage`/trimmed `err.stderr` vào `PM_EXEC_FAILED.message`.
- Human mode giữ nguyên `inherit` (user xem progress/error live trên terminal — error đã cuộn qua rồi,
  chỉ cần short message).

Cost: blast radius phình 1 chút, nhưng mọi thay đổi hội tụ trong exec.ts + guard mới. Nếu controller
muốn tuyệt đối zero scope-grow: chuyển thành follow-up NAMED (pre-publish blocker, liệt kê vào
master-plan Phase 04 checklist). Không chấp nhận phương án "accept luôn không sửa" — sau publish sẽ
có consumer `--json` thật, corrupt-output là bug class tệ nhất của CLI.

### Q4 — Next risk duy nhất + test bắt sớm nhất

Ranked:

1. **Hint-source bug (cao nhất)** — implementer bám chữ "pmsSeen cuối cùng" trong plan → hint sai PM,
   build/test vẫn xanh. Test bắt sớm nhất: unit test seed ledger qua temp `JSS_DEVTOOLS_STORE_DIR`
   với `{pmsSeen:['pnpm','npm'], lastPm:'pnpm'}` rồi assert hint chứa `pnpm add -g jss-devtools`.
   Đã có mẫu seed tại `tests/store.test.ts` (mkdtemp + env var + cleanup) — tái sử dụng.
2. **Missed early-return tại 3 call sites** → TypeError `result.cmdStr` lúc runtime. Về lý thuyết
   `pnpm typecheck` bắt ngay (strict narrowing); phòng hờ: unit test chạy command handler với mocked
   failing exec + assert output parse được 1 JSON doc duy nhất, không TypeError, exitCode 1.
3. **Channel purity khi guard emit lỗi ở JSON mode** — bất kỳ warn/print nào ngoài `logger.json` sẽ
   phá doc. Test: spy `process.stdout.write` (pattern `tests/prompts.test.ts:15`), join hết write rồi
   `JSON.parse(...)` thành công là pass. Nhớ copy `afterEach(() => {process.exitCode = undefined})`
   tránh leak exitCode giữa các test chạy chung worker.

Thứ tự làm: viết 3 unit test trước (guard-fail, hint-source, notes-with-yes) rồi refactor tới khi
xanh — refactor tiến dần từng call site vẫn luôn có lưới.

## Checklist (cho controller)

1. Amend `phase-03-review-cleanup.md`: R4 source = `lastPm ?? 'npm'`; R1 thêm early-return 3 call
   sites + guard signature `(options, failPayloadBase, execThunk)`; quyết định collapse ExecResult;
   ack hoặc defer stdio-capture.
2. `exec-guard.ts` mới + unit test (thunk-driven).
3. `flow.ts` R4 (lastPm) + hint `\nInstall with: <pm> add -g <pkg>` dòng riêng; JSON thêm
   `error.hint` (field sibling của message — khớp style optional-field của payload, machine-friendly
   hơn parse-from-message; package chưa publish nên free).
4. R1 wiring: exec.ts bỏ `ok` | 3 call sites switch guard + early-return.
5. R2: uninstall.ts — in notes `logger.warn` (join \n) ngay sau khi build, gate `!jsonMode`, đồng thời
   strip `noteBlock` khỏi prompt text (tránh double-print ở TTY flow).
6. R3: `uninstall.ts:78` → `PM_DISPLAY_NAMES[detected.pm]`. Ghi nhận: downgrade/update-shared cũng
   show raw pm trong prompt ("via ${detected.pm}?") nhưng chuỗi đó mang ngữ nghĩa command
   (`Will run: <pm> add -g`) — nhét "yarn (classic)" vào copy-paste command là sai; để nguyên, out
   of scope phase này.
7. Gates: lint/typecheck/test/build + manual spot-check JSON fail-path như validation của phase doc.

## Assumptions

- Consola stream routing (warn→stdout hay stderr) không load-bearing vì mọi emits phụ đều gate theo
  jsonMode (high confidence).
- resolveCommand-null gần như unreachable với AgentName đến từ probe thật — branch defensive, chung
  code PM_EXEC_FAILED ổn (high).
- User chấp nhận field `error.hint` mới + `--json` im lặng ở success-path (child output bị swallow)
  nếu fold-in được duyệt (medium-high; flip condition: user muốn zero scope growth → defer thành
  follow-up named trước publish).
