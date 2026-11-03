---
title: "Fix xung đột plan-path trong CLAUDE.md do harness init sinh ra khi có AgentKit"
description: "Khi agentKit=true, harness template dạy convention plans/active/ trong khi AgentKit sở hữu .harness/plans/ với layout thư mục khác — làm mọi nội dung harness tham chiếu plan defer cho AgentKit."
status: pending
priority: P1
effort: 2h
branch: main
tags: [harness, bugfix, templates]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Fix xung đột CLAUDE.md:15 vs CLAUDE.md:25 (plan path khi có AgentKit)

## Outcome (khung kết quả mong muốn)

Sau khi fix, một repository cài harness **với AgentKit** (`jss-devtools init` hoặc
`harness update` phát hiện `ak-*`) sẽ có CLAUDE.md và `.harness/plans/README.md` + template
plan không dạy sai đường dẫn plan nữa: mọi nhắc tới plan trong nội dung harness phải
tham chiếu (defer — nhường) cho AgentKit hoặc mô tả đúng layout của nó. Repository **không có
AgentKit** giữ nguyên convention `active/`/`completed/` hiện tại (tự nhất quán, không bug).

## Chẩn đoán đã chứng minh (scout 2026-11-03)

| Bằng chứng | File:line |
| --- | --- |
| Hàng "Work spanning sessions" luôn ghi `.harness/plans/active/<YYMMDD>-<slug>.md`, không phụ thuộc `agentKit` | `src/modules/harness/templates/claude-block.template.ts:30` |
| Bullet "AgentKit owns `.harness/{docs,plans}/`: follow its skills there" chỉ xuất hiện khi `agentKit=true` → mâu thuẫn trực tiếp với hàng trên | `claude-block.template.ts:12` |
| `harnessPlansReadmeTemplate` dạy `active/` + `completed/` + `git mv`, được cài kind `managed` **kể cả khi agentKit=true** (đè vùng AgentKit sở hữu) | `src/modules/harness/templates/harness-template-files.template.ts:12,113-119,159` + `src/modules/harness/services/install-plan.service.ts:95` |
| Template plan.md cũng dạy convention cũ | `harness-template-files.template.ts:159` (và quanh đó) |
| Layout AgentKit thật: thư mục `.harness/plans/<YYMMDD>-<HHMM>-<slug>/` chứa `plan.md` + phase files, reports ở `reports/`; không có `active/`/`completed/` | Hook prompt AgentKit thực tế ("Plan dir: .harness/plans/261103-1418-{slug}/") + skill ak-plan (plan dir = thư mục timestamped) |

## Hướng fix (cause-aligned)

Nguyên nhân là **template không tham số hoá theo agentKit**, không phải AgentKit sai hay
README sai. Nên fix theo hướng: truyền `agentKit` vào các template liên quan plan và đổi nội
dung theo nhánh:

- Khi `agentKit === false`: giữ nguyên văn convention `active/`/`completed/` (không đổi hành
  vi hiện tại cho repo thuần harness).
- Khi `agentKit === true`:
  - Hàng "Work spanning sessions" trong claude-block: ghi đích là `.harness/plans/` và nhường
    cho kỹ năng (skill) plan của AgentKit (không ghi `active/<YYMMDD>-<slug>.md`).
  - `plans/README.md`: mô tả layout AgentKit (thư mục `<YYMMDD>-<HHMM>-<slug>/` với `plan.md`
    + phase files, reports ở `reports/`), ghi rõ AgentKit sở hữu thư mục này và README chỉ là
    mục lục (index) do harness giữ cập nhật.
  - `templates/plan.md`: khi agentKit=true, trỏ tới kỹ năng plan của AgentKit thay vì dạy cấu
    trúc riêng; không dạy `git mv` sang `completed/`.

## Non-goals (phạm vi loại trừ)

- Không đổi logic cài đặt/update ngoài việc truyền tham số `agentKit` thêm vào template.
- Không xoá file `plans/README.md` khỏi danh sách cài đặt (giữ lifecycle managed — quản lý
  nguyên trạng, tránh phải xử lý xoá file trong luồng update).
- Không đổi layout hay hành vi của AgentKit.
- Không đụng nội dung khác của claude-block (decisions, hooks, done-means-proven).

## Acceptance criteria (tiêu chí nghiệm thu)

1. Với `agentKit=true`: chuỗi `plans/active` và `completed/` **không còn** trong block
   CLAUDE.md sinh ra, trong `plans/README.md`, và trong `templates/plan.md`; nội dung mô tả
   đúng layout thư mục timestamped của AgentKit.
2. Với `agentKit=false`: output của cả ba template **giống hệt trước fix** (so sánh bằng
   snapshot/expect trong test).
3. Test có case phủ cả hai nhánh agentKit, gồm test âm định dạng (fixture) khẳng định
   `plans/active` vắng mặt khi agentKit=true.
4. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` xanh.

## Phases

| Phase | File | Nội dung |
| --- | --- | --- |
| 01 | [phase-01-template-fix.md](./phase-01-template-fix.md) | Tham số hoá agentKit cho 3 template + install service |
| 02 | [phase-02-tests-verify.md](./phase-02-tests-verify.md) | Test hai nhánh + chuỗi kiểm tra full |

## Ràng buộc

- KIỂM TRA TRƯỚC KHI SỬA: xem test hiện có snapshot/expect nội dung template ở đâu
  (tests/ cho harness update/install) để cập nhật đúng, không làm yếu test.
- Đang có stash `landing-site-hello-world-wip` chứa thay đổi ở docs/, package.json, site/ —
  **không đụng các file đó** (trừ khi trùng bắt buộc); sau khi fix xong sẽ `git stash pop`.
  Nếu buộc phải chạm file trùng với stash, dừng và báo lại planner.
