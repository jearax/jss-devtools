---
phase: 02
title: "Test hai nhánh agentKit + chuỗi kiểm tra full"
status: pending
priority: P1
effort: 1h
dependencies: ["01"]
---

# Phase 02 — Test hai nhánh agentKit + chuỗi kiểm tra full

## Goal

Test (bộ kiểm thử) phủ cả hai nhánh agentKit, trong đó nhánh true không còn dạy path sai, và
nhánh false bất biến.

## Files to Create / Modify

- Modify: test hiện có của harness install/update (tìm trong `tests/` — grep
  `plans/active\|harnessClaudeBlock\|harnessPlansReadme` để tìm suite liên quan)

## Tasks & Steps

1. Grep test hiện có: `grep -rn "plans/active\|harnessClaudeBlock\|PlansReadme\|claude-block" tests/`
   để tìm các expect/snapshot cần cập nhật.
2. Bổ sung/adjust expect:
   - Nhánh `agentKit=false`: giữ expect nguyên văn (bất biến nội dung).
   - Nhánh `agentKit=true`: expect **vắng mặt** của `plans/active` trong block CLAUDE.md,
     trong plans README, và trong template plan; expect **hiện diện** của mô tả layout
     AgentKit (vd chuỗi `<YYMMDD>-<HHMM>-<slug>` hoặc nhắc skill plan của AgentKit).
3. Kiểm tra luồng `harness update` với repo có AgentKit: đọc service update-decide/apply để
   xác nhận file managed được ghi lại với nội dung mới khi update chạy (không cần thay đổi
   code update nếu truyền tham số đã chảy đủ; chỉ xác nhận bằng test).
4. Chạy chuỗi full:
   ```sh
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```

## Verification

- Full sequence xanh, output thật ghi vào report.
- Đối chiếu từng acceptance criteria trong plan.md, liệt kê đạt/chưa đạt.
