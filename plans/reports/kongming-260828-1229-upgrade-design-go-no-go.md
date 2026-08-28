---
title: "Kongming GO/NO-GO — upgrade command design checkpoint"
created: 2026-08-28
verdict: GO (3 mandatory amendments)
plan: upgrade command design (mirror của plans/260821-1050-uninstall-command-design)
---

# Kongming Checkpoint — upgrade command design (2026-08-28)

## Verdict: **GO** — với 3 amendments BẮT BUỘC

Contract của user đọc đúng, gap table G1–G6 khớp source (tự verify từng dòng), nhưng
**cơ chế subcommand của citty mà plan giả định sẽ PHÁ vỡ decision (1) "update = full alias
incl. spec"** — đã verify empirical trên đúng version citty đang lock (0.2.2). Sửa được,
rẻ, nhưng phải sửa trong plan trước khi /ak:cook.

---

## Amendments bắt buộc

### A1 — `update list` KHÔNG dùng citty `subCommands`; dispatch thủ công theo positional

Verified empirical (citty@0.2.2, pnpm-lock.yaml:1286, không phải đoán):

- `runCommand` (`citty/dist`): `rawArgs.findIndex((arg) => !arg.startsWith('-'))` → positional
  đầu tiên bị coi là tên subcommand. Không match → `throw CLIError E_UNKNOWN_COMMAND` →
  runMain in usage + exit 1. Repro thật: `update 1.2.3` → `Unknown command 1.2.3`.
  ⇒ Có `subCommands: { list }` thì **`update <specVer>` không bao giờ chạy được** — mâu thuẫn
  trực tiếp decision (1) full-alias-incl-spec.
- `ls` dưới dạng subcommand alias thì được (2 keys cùng lazy import) — nhưng noting since A1.

**Fix:** bỏ `subCommands` khỏi update.ts; khai báo `specVer` positional như upgrade.ts;
trong `run`, nếu positional đầu ∈ `{list, ls, check}` → chạy list-handler (forward `json`),
ngược lại → `runUpgradeFlow(extractSelfArgs(args), 'update')`.

Bonus có chủ đích: `update bogus` đổi từ citty usage-dump thô → `SPEC_INVALID` structured
JSON (đúng semantics alias của upgrade) — contract change có ý, ghi vào plan.

### A2 — Live bug phải đóng trong phase này: parent-run chạy SAU subcommand

Citty 0.2.2 chạy `cmd.run` của parent SAU khi subcommand hoàn tất (repro: `update list` →
`["SUB","PARENT spec=list"]`). Đứng trên code hiện tại: **`jss-devtools update check` hôm nay
chạy check xong rồi exec `runUpgradeFlow({}, 'update')`** — TTY: prompt upgrade bất ngờ;
non-TTY: auto-proceed (reversible) → **thử install thật**. Nghiêm trọng hơn: update.ts:82
hardcode `{}` nên `--dry-run` cũng không cứu.

A1 tự khử bug này (một run duy nhất, không double-exec), nhưng phải có regression test:
`update run specVer='check'` + PM detected + `--yes` → `execOrDryRunInstall` KHÔNG được gọi,
exit 0.

### A3 — Gate major-bump phải miễn `--dry-run`; G6 là tiền đề

- Pass `destructive: resolved.majorBump === true && !dryRun` vào `confirmOrCancel` — **tái dùng
  nguyên văn `ConfirmOptions.destructive`, không đổi signature prompts.ts** (trả lời Q4).
  Dry-run không mutate gì → gate nó là vi phạm least-astonishment + phá CI preview.
  (Uninstall precedent có gate cả dry-run — chấp nhận ở đó, không copy sang đây.)
- **G6 (hardcode `baseResult(..., true)`) phải fix trước/cùng** — nếu không, payload
  REQUIRES_CONFIRMATION của gate sẽ mang `dryRun: true` sai trên real-exec path. Test phải
  assert `parsed.dryRun === false`.

Ma trận gate final (ghi vào plan): TTY không --yes → prompt (giữ nguyên) · non-TTY không
--yes + major → exit 1 REQUIRES_CONFIRMATION · non-TTY không --yes + minor/patch → auto-proceed
(giữ CI hands-free) · có --yes → đi qua mọi bump · có --dry-run → không bao giờ gate (A3).

---

## Trả lời 7 câu hỏi

**Q1 — đọc lại answers của user:** Đúng, không over-reach. (1) full-alias-incl-spec rõ ràng,
nhưng chỉ khả thi qua A1. (3) gate major thu hẹp bảng "upgrade auto-proceed" của uninstall
plan (2026-08-21) — chỉ cho major bump; nên ghi chú supersede trong plan để khỏi tưởng regression.
Không có điểm nào cần hỏi lại user; A3 là carve-out kỹ thuật, không đổi intent.

**Q2 — citty mechanics:** Collision XẢY THẬT (A1). Rename vs additive: **ADDITIVE** — giữ
`check`, thêm `list` (canonical) + `ls`, cả ba cùng handler. Lý do: chi phí ~0; old-lineage
1.0.0 đang trên npm nên có thể có user/script đang chạy `update check` — rename chỉ mất, không
được gì. `ls`: trivial dưới dispatch thủ công.

**Q3 — G1:** Code: **`REGISTRY_FETCH_FAILED`** — cùng họ giọng `{DOMAIN}_{OUTCOME}` với
`PM_EXEC_FAILED`/`REQUIRES_CONFIRMATION`. Loại: `REGISTRY_UNREACHABLE` sai cho 404/5xx,
`NETWORK_ERROR` sai cho 5xx, `FETCH_FAILED` quá generic. Payload **rich form** (precedent
SPEC_INVALID): `baseResult` + `command` + `spec` + `current` + `error{code,message}`; message
tái dùng nguyên message thrown (đã có cause). Cause trong message: CÓ — và khuyến nghị
1-line core tweak `fetch-package.ts:45`: `lastError instanceof Error ? lastError.message :
String(lastError)` để bỏ noise `TypeError: ` ("fetch failed" / "Registry returned 404" /
"aborted"). Đây là message-quality tweak, không phải phân loại cause thành fields — core vẫn
throw-y, 1 throw site, không error class mới. In-scope. Phân loại machine-readable
(`error.cause: 'timeout'|'http_404'`) = out-of-scope (YAGNI, chưa có consumer). Hint field:
không cần bây giờ. Guard scope: bọc CHỈ await fetch (dòng 30), helper local `fetchOrReport`
theo pattern `removeOrReport`; parseSpec/resolveTarget pure — không bọc.

**Q4 — gate placement:** Dùng `destructive: resolved.majorBump && !dryRun` — zero diff ở
prompts.ts, logic guard vẫn single-source. Reject pre-check riêng trong runUpgradeFlow (fork
logic mà prompts.ts đã own — đúng thứ uninstall plan đã loại). Generalize prompts.ts thêm
param reason/message: defer — thêm khi có phàn nàn về chữ "destructive" với major bump.

**Q5 — "Will run":** GIỮ dòng, build qua `resolveCommand(detected.pm, 'global',
[`${PKG}@${target}`])` ngay trong update-shared — precedent có sẵn: `flow.ts:24` (installHint)
đã làm đúng vậy. Không đụng exec.ts (giữ đúng ràng buộc "untouched"); không drop dòng (mâu
thuẫn decision user). Drift risk với exec.ts nội bộ: khử bằng **lockstep test bắt buộc** —
prompt text phải chứa đúng `${resolved.command} ${resolved.args.join(' ')}` cho từng pm
(verified hôm nay: npm → `npm i -g`, pnpm → `pnpm add -g`, yarn → `yarn global add`, bun →
`bun add -g`; chỉ pnpm khớp hardcode cũ). Đồng thời: `via ${detected.pm}` →
`PM_DISPLAY_NAMES[detected.pm]` (R3 precedent); strip bumpNote khỏi prompt, warn standalone
(G5, R2 precedent). Khi sau này merge downgrade được phép đụng exec.ts: fold formatter vào
exec.ts owner — ghi vào non-goals của downgrade plan.

**Q6 — test-first list** (trước refactor, conventions `tests/uninstall.test.ts`: vi.mock
module graph + spy `process.stdout.write` + `stdoutOf()` + `afterEach` reset `process.exitCode
= undefined` + `vi.restoreAllMocks()`; chạy thẳng `command.run({args, rawArgs: []})`):

Mocks: `@/core/detector/global-pm`, `@/core/store/store`, `@/core/self-installer/exec`
(execOrDryRunInstall), **`@/core/registry-client/fetch-package`** (fetchPackageMetadata).

1. G1: fetch reject → json: 1 doc, `REGISTRY_FETCH_FAILED`, exit 1, rich fields, message chứa
   cause; human: `logger.error` 1 lần, không `    at `.
2. G2: exec reject 2 shape (execa non-zero có shortMessage/stderr; resolveCommand-null) →
   `PM_EXEC_FAILED` rich (pm/current/target), exit 1; human không stack.
3. G3: json real-exec → `execOrDryRunInstall(..., { capture: true })`; dry-run →
   `{ capture: false }` (mirror uninstall.test.ts:133-159).
4. G4: mock `@clack/prompts`.confirm → assert prompt chứa đúng chuỗi resolveCommand cho
   npm + yarn (lockstep A-answer-Q5), chứa display name `yarn (classic)`, và KHÔNG còn '⚠️'
   trong prompt (đã strip).
5. G5: human + --yes + major → `logger.warn` chứa "Major version bump"; json mode → warn
   không gọi, chỉ field `majorBump`.
6. Gate: non-TTY (default vitest) + major + không yes → exit 1 `REQUIRES_CONFIRMATION`,
   `parsed.dryRun === false` (A3/G6); minor + không yes → exec ĐƯỢC gọi (auto-proceed không
   regression); --yes + major → exec được gọi; --dry-run + major + không yes → không gate.
7. Dispatch/alias (A1/A2): specVer `list|ls|check` → list path, `execOrDryRunInstall` KHÔNG
   gọi; specVer `1.0.0` + --yes → upgrade path chạy.
8. Alias parity: `update 1.0.0 --dry-run --json` → payload `command: 'update'`,
   `result: 'dry-run'`.

**Q7 — Top-3 next risks + manual tests an toàn:**

1. **Dispatch edge cases sau A1** (`update --json list`, flags trước/sau từ khóa, help text
   mất COMMANDS section) — khử bằng test 7-8 + 1 lượt manual matrix.
2. **Registry old-lineage (tự verify: dist-tags.latest = 1.0.0, next = 0.0.52)** — real-exec
   upgrade sẽ cài code CŨ đè dev environment. AN TOÀN: mọi test `--dry-run`;
   `upgrade` non-TTY KHÔNG --yes → kỳ vọng REQUIRES_CONFIRMATION exit 1 (0.1.0→1.0.0 là
   major — test gate sống, không đụng máy); `upgrade 0.0.52 --dry-run` → SPEC_INVALID hướng
   downgrade; `update list --json | jq` (fetch thật, read-only); `upgrade --yes --dry-run
   --json | jq` → đúng 1 doc. CẤM: `upgrade --yes` / `update --yes` real-exec cho tới khi
   0.1.0 được publish.
3. **Prompt/exec drift (Q5)** — lockstep tests; revisit khi merge downgrade.

## Checklist cho /ak:cook (test-first)

1. Viết test 1-8 (red trước) → 2. A1 dispatch rewrite update.ts → 3. update-shared:
   fetchOrReport (G1) · installOrReport + capture (G2/G3) · prompt display-name + Will-run +
   strip bumpNote + warn standalone (G4/G5) · `baseResult(..., dryRun)` (G6) ·
   `destructive: majorBump && !dryRun` (A3) → 4. 1-line fetch-package message tweak →
5. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → 6. Manual matrix Q7.2 →
7. KHÔNG commit — user manual-test gate trước (ritual), không auto-push.

## In-scope xác nhận / out-of-scope giữ nguyên

- In: update.ts + update-shared.ts + fetch-package.ts (1 dòng) + tests. `update-check.ts`
  chỉ chạm phần gọi lại (console.log + fetch không-guard của nó vẫn follow-up theo non-goals).
- Out (giữ): downgrade.ts còn nguyên G1-G6 riêng — known debt, kế hoạch riêng; shared
  exec-guard util; update-check internals; update-notifier; publish/retag.

## Unresolved questions

Không có câu nào block. 2 điểm user có thể overrule khi review plan (mặc định đã chọn):
(1) A3 dry-run carve-out cho gate; (2) giữ `check` bên cạnh `list/ls` (additive) thay vì rename.
