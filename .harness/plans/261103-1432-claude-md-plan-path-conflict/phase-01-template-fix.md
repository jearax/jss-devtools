---
phase: 01
title: "Tham số hoá agentKit cho các template liên quan plan"
status: pending
priority: P1
effort: 1h
dependencies: []
---

# Phase 01 — Tham số hoá agentKit cho các template liên quan plan

## Goal

Ba template liên quan plan nhận `agentKit` và đổi nội dung theo nhánh; nhánh `agentKit=false`
bất biến so với trước fix.

## Files to Create / Modify

- Modify: `src/modules/harness/templates/claude-block.template.ts`
- Modify: `src/modules/harness/templates/harness-template-files.template.ts`
- Modify: `src/modules/harness/services/install-plan.service.ts`

## Tasks & Steps

1. Đọc `harness-template-files.template.ts` toàn văn trước khi sửa (hiện mới scout theo đoạn)
   và tìm mọi vị trí dạy `plans/active`, `completed/`, `git mv`.
2. `claude-block.template.ts`:
   - `ownershipBullets` đã nhận `agentKit` — giữ nguyên.
   - Bảng "Where knowledge goes": biến hàng "Work spanning sessions" theo `agentKit`.
     Khi true: đích ghi `.harness/plans/`, cột "Start from" trỏ tới skill plan của AgentKit
     (ví dụ: follow the plan skill AgentKit installs); **không** ghi `active/<YYMMDD>-<slug>.md`.
3. `harnessPlansReadmeTemplate` hiện là hằng string không tham số — chuyển thành function
   nhận `agentKit` (hoặc hai biến thể chọn theo cờ). Nội dung khi `agentKit=true`:
   - Mô tả layout AgentKit: thư mục `.harness/plans/<YYMMDD>-<HHMM>-<slug>/` chứa `plan.md`
     + phase files; reports ghi ở `reports/` cạnh plan dir.
   - Ghi rõ AgentKit sở hữu `.harness/plans/`; README chỉ là mục lục, update của harness
     giữ file này cập nhật.
   - **Không** dạy `active/`, `completed/`, hay `git mv`.
4. `harnessPlanTemplateTemplate` tương tự: khi `agentKit=true`, trỏ tới skill plan của
   AgentKit thay vì dạy cấu trúc `active/`/`completed/`; bỏ phần `git mv` sang `completed/`.
5. `install-plan.service.ts` (OWNED_FILES): gọi `harnessPlansReadmeTemplate(input.agentKit)`
   và `harnessPlanTemplateTemplate(<agentKit>)` — kiểm tra chữ ký hiện tại
   (`harnessPlanTemplateTemplate` đã là function nhận gì) và truyền nhất quán.
6. Kiểm tra không có nơi thứ ba import các template này với chữ ký cũ (grep import).

## Verification

```sh
pnpm typecheck
pnpm lint
```
