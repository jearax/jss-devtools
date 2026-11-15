---
id: 0057
title: init --framework react copies the Vite React app kept in templates/react/
status: Accepted
date: 2026-11-15
supersedes: 0030 (the non-goal of frameworks other than node, for react)
---

# 0057: init --framework react copies the Vite React app kept in templates/react/

## Context

[0030](./0030-init-node-preset.md) builds `node` and [0047](./0047-init-nest-preset.md) added
`nest`; `--framework react` exits 1. The user wants a React preset with a small common base, built
from the Vite CLI's output and their own references. Contract and evidence: the
[brainstorm report](../plans/reports/brainstorm-261115-1232-init-react-preset.md).

## Decision

`init <dir> --framework react` and `init <dir> --monorepo --framework react` (app at `apps/react`)
create a Vite, React, TypeScript and React Compiler app; existing mode with `react` exits 1 before
any write. The files live as a real project in `templates/react/`, embedded and copied like nest's.

- Libraries: `react-router` 8 in Data Mode, `react-error-boundary`, `zustand`,
  `@openfeature/react-sdk`. `react-hook-form`, `@tanstack/react-query`, `@tanstack/react-table` and
  `tailwind` wait for a later sample tied to `--no-sample`; so do tests in the generated app.
- ESLint stays at 10 for every preset: `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`
  are installed, `eslint-plugin-react` is not.
- `src/` holds `components/{Providers,Polymorphic,layouts}`, `pages/illustrators` for the placeholder
  error pages, `hocs/{AuthGuard,GuestOnlyRoute}`,
  `contexts/FeatureFlags/`, `stores/`, `pages/`, `router/`. Layout and error pages are unstyled
  placeholders; `main.tsx` ends with `void bootstrap();`. The template holds no binary file.
- `src/services/error-reporting.service.ts` comes along from the reference: the error boundaries,
  the router and the feature flag setup report through it. The project name replaces the
  placeholder in `package.json` and in the `index.html` title; in the monorepo the title is the
  project name too.
- App state lives in zustand stores, co-located with their hooks: one `useXXX.ts` file holds the
  `useXXXStore` store as a named export, written first, and the `useXXX` hook as the default
  export; there is no `src/stores/` folder. A context, where one is needed, is read with `use`, not
  `useContext`; no lint rule enforces it.

> "Tạo từ CLI vite, rồi update 1 số files theo." · "Dùng bản mới nhất … tức là 8x" (user, 2026-11-15)

> "Bỏ hết phần eslint-plgin-react(-*)" · "Vậy thì giữ eslint-plugin-react-refresh" · "không có kéo
> eslint xuống 9x" · "Dùng vite react + typescript + react compiler"

> "Libs case: react-router, react-error-boundary" · "Cho zudtand làm base libs luôn." · "OK, dùng
> @openfeature/react-sdk" · "Còn lại cho sample … chưa xử sample ở plan này, chi notes để xử lý sau."

> "Làm giống nest, tức là cần support cả --monorepo" · "Không test" · "assets thì placeholder hoặc
> dùng .gitkeep thôi cũng đc."

> "src/components/{Providers,Polymorphic} · src/layouts/{} · src/hocs/{AuthGuard,GuestOnlyRoute} ·
> Feature flags có thể tham khảo refs cũ." · "chỉ placeholder with text dạng "Hello <X>""

> "tôi muốn có src/pages/illustrators" · "src/layouts/ -> src/components/layouts/" (user, 2026-11-16,
> on manual test: the placeholder error pages group under `pages/illustrators/`, the layouts move
> under `components/`)

> "zustand và custom hook sẽ đi cùng nhau … không có folder src/stores/ -> mà ghi chung cùng vào
> 1 file của useXXX.ts, trong đó useXXXStore (export name) còn useXXX thì export default, trong đó
> useXxxStore thì viết trước." (user, 2026-11-16)

> "Chỗ nào không cú nhu cầu đặt biệt của context … thì dùng zudtand thay thế context" · "dùng API
> của React19, use thay vì useContext" · "Không force quy tắc"

> "OK hết, cứ tiếp tục tới phase 4, cho các pined lib lên" (user, 2026-11-15, on the planner's
> list: keep `eslint-plugin-react-hooks`, bring the error reporting service, the title takes the
> project name, and the pins that aged move up with this work)

## Consequences

- `eslint-plugin-react-hooks` stays because React Compiler's lint rules ship in that plugin.
- Harder: every React version moves through `scripts/pin-node-preset.mjs`, in one peer-resolved set
  with `node` and `nest`.
- Enforced by: the init plan tests and the `INIT_E2E=1` suite the implementing plan adds.
