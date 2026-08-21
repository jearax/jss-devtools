# Log vs Throw trong Guard Functions

> Guard/check function chọn cơ chế theo tầng: core trả data hoặc throw, boundary (command layer) log + exit code, guard trung gian tự log chỉ khi mọi caller đồng ý một UX.

---

## Overview

Thảo luận từ câu hỏi thiết kế trong `jss-devtools`: vì sao `requireGlobalPM` log + set exit code + return null thay vì throw, và khi viết guard/check/role function thì khi nào log, khi nào throw. Kết luận là một framework 3 kênh (throw / log / exit code) với nguyên tắc phân tầng theo mức độ fn biết bối cảnh trình bày (presentation context).

---

## Topics

### 1. Cơ chế báo lỗi cho guard/check functions

**Subjects**: throw, log, exit code, return null

| Subject | Người nhận | Bản chất | Dùng khi |
|---|---|---|---|
| throw | Caller (code phía trên) | Chuyển giao quyền quyết định — unwinding đến catch | Fn không biết context trình bày; caller có thể recover; code là/hợp thành library |
| log | Human (người gõ lệnh) | Truyền thông — báo cho người biết | Đứng ở đỉnh call stack (command handler, main); failure terminal, chỉ cần report |
| exit code | Machine (shell, CI, pipe) | Tín hiệu kết quả | Cùng chỗ với log — thuộc về boundary, không bao giờ nằm trong core |
| return null / Result | Caller | Trả về data — failure là câu trả lời hợp lệ | Expected branch (not-found, không match) — không phải exceptional |

**Decision**: Adopt framework 3 tầng cho `jss-devtools` — core (`src/core/`) trả data hoặc throw, không log; command layer log + exit code; guard trung gian (`requireGlobalPM`) tự log vì 3 callers muốn identical UX, và return type `DetectedPM | null` khiến TS ép caller check null lúc compile.

**Rationale**: Tầng dưới không thể biết context trình bày (JSON vs human vs programmatic API) — log từ core steals quyết định của tầng trên, không suppress/format được, double-report khi tầng trên cũng log. Throw cho expected branch là nhầm lẫn category (Rust dạy rõ nhất: Result cho recoverable, panic cho unrecoverable). oclif là precedent cho hướng còn lại: throw typed errors, một handler ở `bin/run.js` format + exit.

**Trade-off của guard-tự-log vs throw-typed-error**:

| | Guard tự log (chọn) | Throw + handler trung tâm |
|---|---|---|
| Call site | 0 boilerplate, UX nhất quán tuyệt đối | Mỗi command try/catch, hoặc xây 1 global handler |
| Quên xử lý | TS null-check ép compile-time | Không thể quên — uncaught tự dừng |
| Mở rộng | Khác nhau UX theo caller thì phải tách lại | Thêm error type + map format là xong |

**3 smells tránh**: (1) log + throw cùng lúc — double report; (2) throw cho expected branch — not-found là câu trả lời, không phải exception; (3) log từ tầng core — giết khả năng tái dùng làm library vì consumer không tắt log được.

**Mapping thực tế trong `jss-devtools`**: `detectGlobalPM` return null (core, expected branch); `parseVersionFromList` return null (output không parse được = không match); `requireGlobalPM` log + exitCode + null (boundary-guard, 3 callers đồng UX); `confirmOrCancel` return boolean + exitCode khi cancel; `execOrDryRunRemove` throw khi PM fail — đúng chuẩn core, nhưng boundary chưa có catcher (gap đã flag: throw từ core + thiếu catch ở command = stack trace thô).

**Sources**:
- [Node.js Errors API](https://nodejs.org/api/errors.html)
- [oclif Error Handling](https://oclif.io/docs/error_handling)
- [The Rust Book — Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html)

---

## Decisions Summary

| # | Topic | Decision | Why |
|---|---|---|---|
| 1 | Log vs throw trong guards | 3-tier framework: core throw/return-null, boundary log+exit, shared guard tự log khi callers đồng UX | Tầng dưới không biết presentation context; TS null-return ép caller check |

---

## References

- [Node.js Errors API](https://nodejs.org/api/errors.html) — error classes, codes, propagation: throw đồng bộ, Promise rejection, callback err, EventEmitter error event
- [oclif Error Handling](https://oclif.io/docs/error_handling) — precedent throw-typed-errors: catch ở Command.catch rồi bin/run.js format + exit
- [The Rust Book — Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html) — Result<T,E> cho recoverable vs panic cho unrecoverable; compiler ép xử lý trước khi build
