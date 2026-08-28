---
title: "upgrade phase-01 — citty subcommand trap, silent major jump, registry shape bug"
date: 2026-08-28
summary: A1 manual dispatch fixed update alias + double-exec live bug; A3 major-bump gate; registry versions object normalization revived update check
---

# upgrade phase-01 — citty subcommand trap, silent major jump, registry shape bug

## What happened
- Brainstorm reuse uninstall template cho `upgrade` (+ `update` alias). Live probe vô tình thực thi upgrade thật (non-TTY auto-proceed) — disclose + restore 0.1.0 tgz; probe cũng xác nhận live: stdout pollution (G3), cmdStr `npm i -g` ≠ prompt hardcode `add -g` (G4), major jump 0.1.0→1.0.0 im lặng không consent (G5).
- Kongming GO + 3 amendments (verify empirical citty@0.2.2): A1 — citty `subCommands` match positional đầu tiên (`update 1.2.3` → Unknown command) + parent run() chạy SAU subcommand → `update check` double-exec flow upgrade với `{}` hardcode (install thật non-TTY, --dry-run vô dụng). A3 — gate major-bump miễn dry-run qua `ConfirmOptions.destructive`, prompts.ts không đổi.
- User overrule: bỏ list|ls, dispatch thủ công chỉ `check`; ack gate + carve-out; cho phép 1-line core tweak.
- Cook test-first: 20 tests đỏ → implement fetchOrReport (REGISTRY_FETCH_FAILED) + installOrReport (PM_EXEC_FAILED) + capture + willRunOf resolveCommand + standalone ⚠️ + gate + cancelled dryRun thật + update.ts dispatch rewrite.
- Live finding (ngoài plan): npm registry trả `versions` là OBJECT keyed-by-version — type + raw cast enshrine array → `update check` CHƯA TỪNG chạy live (`TypeError: meta.versions.filter`), exact-spec `update 0.0.52` crash stack trace ngoài guard. Fix normalize tại registry-client boundary (kongming xác nhận phủ cả consumer thứ 4 downgrade.ts:55). Cùng class "mock enshrined sai format" với npm 11/yarn NDJSON.
- Code-reviewer static 0 critical/high; folds: e2e smoke dispatch single-doc, strip plan/phase labels khỏi tests (user rule), dryRun unify fetch payload, willRunOf fallback chain flow.ts precedent.

## Decision
- `update` = full alias của upgrade (positional spec) + `check` dispatch thủ công — KHÔNG dùng citty subCommands nữa. `update bogus` → SPEC_INVALID structured thay vì usage-dump.
- Gate matrix: TTY prompt · non-TTY + major + không --yes → REQUIRES_CONFIRMATION exit 1 · minor/patch auto-proceed · --yes pass mọi bump · --dry-run không bao giờ gate.
- UX delta chấp nhận: `update check --help` render parent help (citty chặn --help trước dispatch).
- Core-touch precedent mở rộng: registry-client normalize wire shape tại boundary là pattern đúng (thứ 3 sau detector parsers).

## Next steps
- User manual test (checklist trong phase doc + session): dry-run/read-only only; CẤM real-exec `--yes` tới khi 0.1.0 publish (registry latest = old-lineage 1.0.0). Không commit trước manual test; không push.
- Follow-ups ghi trong non-goals: downgrade plan (G1-G6 mirror + DRY-merge + fold formatter vào exec.ts), update-check internals (exit 2, json fail path, requireGlobalPM, prerelease filter), test-scaffold dedup, update-shared 255 dòng > 200.
- Gates cuối: lint 0 · typecheck 0 · 69/69 · build 0; kongming post-phase GO (report 1325).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
