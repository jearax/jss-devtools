# Kongming Advisory — Phase 3 close-out: GO/NO-GO + manual-test checklist + next steps

Date: 2026-08-27 · Input: implementation đã xong (chưa commit), đệ trình trước manual test ngày mai
Verdict: **GO** — đóng Phase 3 như đã triển khai; không có fix bắt buộc nào trước commit.

## TL;DR

Implementation khớp phase-03 doc từng điểm (R1-R4 + cả 2 amendment đã hấp thụ đúng). Tự chạy lại 4
gates: lint ✓ · typecheck ✓ · 32/32 tests ✓ · build ✓. Empirical probe xác nhận reviewer HIGH-finding
thật (`resolveCommand('bogus-agent')` THROWS TypeError trên đúng pmd 0.2.11 đang pin; cả 7 agents hợp
lệ resolve được cả `global` lẫn `global_uninstall` → sau whitelist không còn đường throw). Hai lựa chọn
thiết kế bị hỏi (whitelist-vs-try/catch, duck-typed shortMessage) đều đúng — giữ nguyên. Không có gì
cần sửa trước khi user manual test ngày mai rồi commit.

## Verified evidence (tự kiểm chứng, không tin tóm tắt)

- Guard R1: `src/commands/self/uninstall.ts:30-59` — json rich-form + `result:'error'` +
  `error.code:'PM_EXEC_FAILED'`, human `logger.error`, `process.exitCode=1`, return null, không throw.
- Notes R2: `uninstall.ts:121-125` in standalone gate `!jsonMode`; prompt text (dòng 129) sạch
  noteBlock → hết double-print. R3 display name cũng ở dòng 129. Cancelled payload dòng 131 dùng
  `dryRun` thật (fix LOW #2 nằm ở đây).
- Hint R4: `src/commands/self/utils/flow.ts:20-31` — `getPmLedger().lastPm ?? 'npm'` (amendment #1
  đúng), whitelist `last in PM_DISPLAY_NAMES`, chuỗi fallback `?? resolveCommand('npm',...) ??
  {command:'npm',args:['install','-g',...]}`; human dòng riêng `flow.ts:54`, json `error.hint`
  `flow.ts:50`.
- Early-return guard tại call site `uninstall.ts:144-152` — narrowing đúng, không deref null.
- Tests `tests/uninstall.test.ts`: 9 tests khớp ma trận tuyên bố (exec-fail 2 shapes json + human
  no-stack; notes `--yes` + json-clean; hint lastPm-vs-pmsSeen order, npm fallback, corrupted
  `lastPm:'bogus-agent'` degrade, human line). Assertion kiểu `stdoutOf()` + một-lần `JSON.parse` tự
  ép single-doc; `afterEach` reset `exitCode` có mặt.
- Gates tự chạy 2026-08-27 01:07: eslint sạch · `tsc --noEmit` sạch · vitest 32/32 (23 cũ + 9 mới,
  gồm smoke non-TTY refuse) · tsup build thành công.
- Empirical pmd (bare-specifier ESM eval trên cây node_modules thật): `'bogus-agent'` →
  `TypeError: Cannot read properties of undefined (reading 'global')`. `npm|pnpm|yarn|bun|deno|nub|
  aube` → CẢ HAI verb `global`/`global_uninstall` đều resolve được, không null. Version pin thực tế
  trong `pnpm-lock.yaml` là **0.2.11** (không phải 1.8.0 như tóm tắt gọi lên — hành vi throw giống hệt,
  không đổi kết luận).
- Constraints audit qua `git status`: chỉ `uninstall.ts` + `flow.ts` là source thay đổi;
  `prompts.ts`/`exec.ts` nguyên vẹn; không tạo util shared mới; smoke non-TTY/dry-run vẫn xanh.
  Lưu ý: `src/commands/self/downgrade.ts` có 1 dòng xoá comment trong working tree — leftover phiên
  trước (comment policy), KHÔNG thuộc phase 3 (xem Housekeeping).

## Trả lời 4 câu hỏi

### Q1 — Go/no-go đóng phase

**GO.** Không có finding mới nào vượt mức nits. Scope thu hẹp tôn trọng trọn vẹn; hai amendment từ
report 0016 vào code đúng thiết kế; test-first có bằng chứng gián tiếp (mock matrix khớp các rủi ro
đã rank). Đóng phase với điều kiện duy nhất là quá trình quy định sẵn: manual test ngày mai xanh rồi
mới commit (không cản trở).

### Q2 — Có cần chỉnh gì trong các fix?

Không có gì bắt buộc. Chi tiết hai điểm bị hỏi:

1. **Whitelist `in PM_DISPLAY_NAMES` thay vì try/catch — GIỮ WHITELIST.**
   - `PmLedger.lastPm` khai báo `AgentName | null` (`store.ts:23`) nhưng là dữ liệu file-backed không
     đáng tin → runtime revalidate chính là sửa lại sự overclaim của type-level. Whitelist nói rõ
     ranh giới tin cậy; try/catch che cả bug-class khác (store trả shape sai, logic lỗi) dưới cùng một
     nhánh "degrade âm thầm".
   - Degradation deterministic về npm — đã có test chứng minh (`lastPm:'bogus-agent'`).
   - Sau whitelist, empirical cho thấy KHÔNG agent hợp lệ nào throw và KHÔNG ai trả null cho 2 verb →
     tầng `?? resolveCommand('npm')` và literal fallback hiện unreachable — đúng tư thế belt-and-
     suspenders tại trust boundary (rẻ, có lý do tồn tại nếu pmd thêm agent thiếu command table).
   - Kết luận: architecture chống corrupted-ledger ở chỗ này kín. Lỗ hổng còn lại thuộc chỗ khác
     (xem mục deferredfinding#3, xếp hạng ở Q4).

2. **Duck-typed `shortMessage` (prefer exit-code+command context) — GIỮ.** Tránh coupling class
   `ExecaError` theo version, fixture test rẻ (`Object.assign(new Error(...), {...})`). N Fitzpatrick:
   trường biên `shortMessage === ''` sẽ passthrough chuỗi rỗng — thực tế không xảy ra với execa;
   không đáng churn trước commit.

Nits ghi nhận, KHÔNG sửa trong phase này: (a) chain tính `resolveCommand('npm',...)` lặp 1 lần nữa
khi pm đã là `'npm'` — chi phí vô nghĩa, giữ vì dễ đọc; (b) payload lỗi PM_EXEC_FAILED không có
top-level `message` — trùng deferral #4 đã record (SPEC_INVALID precedent), tôn trọng quyết định đã
verify, không đảo ngược; (c) mock `execSuccess` vẫn mang 3 dead-field của `ExecResult` — nằm trong
cleanup đã defer.

### Q3 — Manual-test checklist (thứ tự tối ưu theo chuyển-state)

Unit tests không cover được: real detector probe ngoài sandbox, execa spawn thật (`stdio:'inherit'`),
TTY render, storage file thật. Thứ tự dưới xếp sao cho state chuyển đúng hướng (uninstall thành công
trước để mở đường PM_NOT_DETECTED):

A. Regression rẻ (2 phút)
1. `pnpm build && node dist/cli/cli.js uninstall --dry-run` — in "Would execute", exit 0, binary còn.

B. Vòng đời thật (phần unit không thể cover)
2. Đóng gói: `pnpm pack` → `npm i -g ./jss-devtools-<ver>.tgz` (hoặc `npm link`). Xác nhận
   `which jss-devtools`.
3. TTY, KHÔNG flag: `jss-devtools uninstall` — notes (nếu có) in MỘT lần TRÊN prompt; prompt dùng
   display name ("pnpm"); trả lời **no** → output cancel sạch, binary còn nguyên.
4. Chạy lại, trả lời **yes** → lệnh remove thật chạy với stdio inherit; success message;
   `which jss-devtools` rỗng; `echo $?` = 0.
5. Cài lại lần nữa rồi `uninstall --yes` — xác nhận notes hiện dù prompt bị skip, không double-print.

C. Độ tinh khiết JSON ngoài môi trường thật
6. `node dist/cli/cli.js uninstall --json --dry-run | jq .` — parse ra đúng 1 doc, `result:"dry-run"`.
7. Sau khi cài lại: `uninstall --json --yes | jq .` — 1 doc parseable, `result:"success"` (bắt mọi
   byte lạ nếu child output/npm progress chen vào stdout với `inherit`).

D. PM_NOT_DETECTED + corrupted ledger (CHỈ đến được thật sau khi B remove xong)
8. Còn đang uninstalled: `jss-devtools uninstall` (human) → message not-installed + dòng riêng
   `Install with: ...` nhúng PM hợp lý (lastPm từ ledger, hoặc npm).
9. **Kiểm thử thủ công cho HIGH-fix:** sửa trực tiếp store file
   (`~/Library/Preferences/jss-devtools/config.json` trên macOS) hoặc
   `JSS_DEVTOOLS_STORE_DIR=/tmp/jss-store` đặt tay — set
   `"pmLedger":{"pmsSeen":[],"lastPm":"bogus-agent","lastSeenAt":"..."}`. Chạy bước 8 lại → phải
   degrade: hint `npm install -g`, KHÔNG stack trace, exit 1. Rồi `--json` version `| jq .` vẫn parse
   được. Đây là chứng minh end-to-end ngoài vitest cho fix hề nhất của phase.
10. Sanity các command chia sẻ `requireGlobalPM` (thay đổi additive duy nhất thấy được từ bên ngoài
    uninstall): `upgrade --dry-run` + `downgrade --dry-run` hành vi cũ nguyên vẹn; trigger nhánh
    not-detected của chúng lúc đang uninstalled → hint xuất hiện như dòng riêng, không crash.

E. Non-TTY (đã có smoke test, 10 giây liếc mắt)
11. `jss-devtools uninstall < /dev/null` (KHÔNG `-y`) → refuses với error, exit 1, không execute gì.

### Q4 — Ranked next steps SAU commit

1. **stdio-capture cho `--json` mode (Phase 04 opener, pre-publish blocker).** `exec.ts:41`
   `stdio:'inherit'` share fd với parent → ouput của PM chen trước `logger.json`, `| jq` gãy; đồng
   thời requirement ngầm của R1 (error message kèm stderr context) không đạt được ở JSON mode vì
   stream không được capture. Là blocker tên tuổi trong kế hoạch, và là design dependency cho vài
   cleanup JSON phía sau — làm trước để các mục sau compost lên nó.
2. **Store-boundary validation (kill-single-root cho corrupted-ledger family).** Validate pmsSeen/
   lastPm ngay tại ranh giới `store.ts` (load-time filter whitelist, trả EMPTY_LEDGER khi lệch).
   Xoá luôn finding#3 deferred ("Previously installed via undefined" — `uninstall.ts:117` vẫn dính
   với ledger thủ công), và tương lai không cần replicate whitelist mỗi consumer mới. Blast radius
   nhỏ, có sẵn test mẫu seeded-ledger.
3. **Downgrade-merge simplify.** Internal DRY, không payoff hành vi, có regression risk nhẹ — gộp cùng
   senior simplify pass đang defer trong non-goals là hợp lý nhất.

## Checklist cho controller

1. Ngày mai: chạy checklist Q3 theo thứ tự A→E.
2. Quyết phục vụ 1 dòng comment ở `downgrade.ts` (xem Assumptions/Housekeeping) TRƯỚC khi `git add`.
3. Commit theo conventional format, mô tả phase boundary (guard local + notes visibility + hint);
   đánh status `plan.md` nếu muốn phản ánh "phase 3 merged, phase 04 pending".
4. Khai Phase 04 với mục #1 bảng Q4 làm opener.

## Success metrics của quyết định này

- Manual test 11 bước: 0 phát hiện bất ngờ nghiêm trọng; mọi JSON path `| jq` parse được.
- Sau commit: 32/32 test vẫn xanh; tree sạch (không còn M nào ngoài plan/report).
- Nháp heuristic: một corrupted-ledger JSON tùy ý không khiến command nào của bộ 4 crash.

## Assumptions

- **Confidence cao** — verdict dựa toàn bộ trên kiểm chứng trực tiếp hôm nay (code + gates + probe
  pmd), không dựa tóm tắt của caller. Claim "7/8 red trước impl" của caller không tái lập được lịch sử
  — không load-bearing vì suite xanh và assertion matrix khớp.
- **Housekeeping (confidence cao, cần quyết user):** dòng xoá comment `downgrade.ts` là leftover phiên
  trước, vô hại, khớp comment policy gần đây — khuyến nghị mặc định: fold vào commit phase 3 và
  disclose trong commit body, HOẶC revert nếu muốn diff surgical-thuần túy. Flip condition: user muốn
  history 1-chủ đề tuyệt đối → separate `chore:` commit.
- **Version notation:** caller ghi "pmd@1.8.0"; lockfile pin 0.2.11. Giả định đó là nhầm nhãn, không
  ảnh hưởng hành vi (throw được tái lập trên chính version pin). Sửa lại record cho chuẩn.
