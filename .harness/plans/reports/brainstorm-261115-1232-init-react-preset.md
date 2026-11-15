# Brainstorm: the `init --framework react` preset

Status: contract answered by the user (2026-11-15), ready for a decision and a plan. Not implemented.
The file map and the constraints are in the
[scout report](./scout-261115-1201-init-react-preset.md).

## Conflict with a decision in force

[Decision 0030](../../decisions/0030-init-node-preset.md) builds only `node`, and
[0047](../../decisions/0047-init-nest-preset.md) added `nest`; `--framework react` exits 1 today
("Framework react is not supported yet"). This preset needs a new decision.

## The user's intent

> "Goal ta muốn viết thêm framework react với 1 số preset cơ bản thông dụng, trong đó 1 số phần code
> tôi cung cấp (cũng chỉ ở mức cho bạn tham khảo và refactor nếu bạn thấy nó không tốt / không ổn)"

> "Tạo từ CLI vite, rồi update 1 số files theo."

> "đang nghĩ tới các libs khả dụng: `react-error-boundary, react-hook-form, zustand, react-router,
> @tanstack/react-query, @tanstack/react-table, tailwind`"

> "setup sẵn react router (… mode client SAP), FeatureFlag, Providers component"

> "Layout + các illustrator như là (Header, Footer, Sidebar, SideNav, 400, 404, 500 - chỉ
> placeholder), Polymorphic"

> "Tất nhiên là cũng cần update command help, docs cho align như "nest" nha."

## User answers (2026-11-15)

> React Router version: "Dùng bản mới nhất trong thời điểm hiện tại viết tool này, tức là 8x"

> ESLint: "thử chấp nhận warning hoặc nếu không được thì không dùng `eslint-plugin-react` luôn, không
> có kéo eslint xuống 9x. Xử lý tương tư cùng strategy cho eslint-plugin-react-hooks,
> eslint-plugin-react-refresh."

> Binary assets: "assets thì placeholder hoặc dùng .gitkeep thôi cũng đc."

> Providers: "Providers.tsx xử lý theo ý bạn, code tôi chỉ tham khảo, typescript lỗi nhiều lắm."

> Components: "Có Polymorphic.tsx, AuthGuard, GuestOnlyRoute"

> ESLint, second round: "Cân nhắc việc cho install các libs eslint-plugin-react,
> eslint-plugin-react-hooks, eslint-plugin-react-refresh. Nó chỉ bị chặn khi như ví dụ bạn nói:
> ERESOLVE, ERR_PNPM_PEER_DEP_ISSUES hay gì đó, cơ bạn là khi cài xong rồi, tuy nó warning nhưng nó
> vẫn work. Hoặc đại loại là live test thật trong tmp các case đó thay vì đoán mò."

> Libraries in the skeleton: "Libs case: react-router, react-error-boundary"

> The other libraries: "Còn lại cho sample "tương tác với flag --no-sample", nhưng cơ bản là chưa xử
> sample ở plan này, chi notes để xử lý sau."

> ESLint, third round: "Để tránh phát sinh quá nhiều thứ, vì đây là esge-case (tức là lib chưa
> official support), nên mình quyết các ý sau: Bỏ hết phần eslint-plgin-react(-*)"

> zustand: "Cho zudtand làm base libs luôn."

> Layout without tailwind: "ý mình chỉ placeholder with text dạng "Hello <X>", chỷ yếu là để base cái
> react-router á, như là: outlet, lazyPage,... Các case lỗi như: 400, 404, 500, ErrorState,..."

> Entry file: "Dùng cấu trúc như `void bootstrap();` cho root trong 'site' nha."

> ESLint, fourth round: "Vậy thì giữ eslint-plugin-react-refresh"

> Stack: "Dùng vite react + typescript + react compiler, khi dùng react-compiler rồi thì sẽ không cần
> bỏ eslint-plugin-react-hooks đúng k?"

> Modes: "Làm giống nest, tức là cần support cả --monorepo"

> Tests in the generated app: "Không test"

> Feature flags: "FF có cần @openfeature/react-sdk không, nói thật với bạn tôi cũng chưa triển khai FF
> thật với @openfeature/react-sdk bao giờ, tôi chỉ biết là FF nó quan trọng, nên tôi tính preset thôi"

> Feature flags, decided: "OK, dùng @openfeature/react-sdk"

> Layout of the generated app: "Phân app sinh ra chưa giống ý tôi. src/components/{Providers,Polymorphic}
> · src/layouts/{} · src/hocs/{AuthGuard,GuestOnlyRoute} · Feature flags có thể tham khảo refs cũ."

> State convention: "Chỗ nào không cú nhu cầu đặt biệt của context (render lại tất cả tree DOM) thì
> dùng zudtand thay thế context"

> Reading a context: "Nếu dùng conetxt, thì dùng API của React19, use thay vì useContext"

> Enforcing the `use` convention with a lint rule: "Không force quy tắc"

## Evidence (run on 2026-11-15)

Each manager installed ESLint 10.14.0 with `eslint-plugin-react` 7.37.5,
`eslint-plugin-react-hooks` 7.1.1 and `eslint-plugin-react-refresh` 0.5.7 in a scratch project.

| Manager                               | With `eslint-plugin-react`                | Without it |
| ------------------------------------- | ----------------------------------------- | ---------- |
| npm                                   | exit 1, `ERESOLVE`                        | exit 0     |
| pnpm, `strictPeerDependencies: true`  | exit 1, `ERR_PNPM_PEER_DEP_ISSUES`        | exit 0     |
| yarn 1                                | exit 0, "incorrect peer dependency" warning | not run  |
| bun                                   | exit 0, no warning                        | not run    |

- The failure is an install error, not a warning, on npm (the default manager) and on pnpm, whose
  generated `pnpm-workspace.yaml` sets `strictPeerDependencies: true`.
- Without it, ESLint 10 ran `reactHooks.configs.flat['recommended-latest']` and
  `reactRefresh.configs.vite()` on a `.tsx` file and reported two errors and one warning, among them
  `react-hooks/set-state-in-effect` and `react-hooks/exhaustive-deps`. Both plugins declare ESLint 10
  in their peer ranges, so neither needs the warning path.
- React Router docs (reactrouter.com, labelled "latest (8.5.1)"): three modes, "additive";
  "Every mode supports any architecture and deployment target, so the question isn't really about if
  you want SSR, SPA, etc. It's about how much you want to do yourself." Data Mode is for those who
  "want data features but also want to have control over bundling, data, and server abstractions".
  Its installation page starts from `npx create-vite@latest` and `npm i react-router`, and imports
  `createBrowserRouter` from `react-router` and `RouterProvider` from `react-router/dom`.

### Second round: can `eslint-plugin-react` 7.37.5 be kept on ESLint 10?

Same scratch project, linting a `.tsx` file with `react.configs.flat.recommended`, the `jsx-runtime`
config, the hooks plugin and the refresh plugin.

| Case                                                                         | Install | Lint                                                  |
| ---------------------------------------------------------------------------- | ------- | ----------------------------------------------------- |
| yarn 1, `settings.react.version: 'detect'`                                   | exit 0  | crash: `contextOrFilename.getFilename is not a function` |
| yarn 1, `settings.react.version: '19.3'`                                     | exit 0  | runs: `react/jsx-key`, `react/jsx-no-target-blank`    |
| npm, `overrides: { "eslint-plugin-react": { "eslint": "$eslint" } }`         | exit 0  | runs, same findings                                   |
| pnpm strict, `peerDependencyRules.allowedVersions` for `eslint-plugin-react>eslint` | exit 0  | runs, same findings                            |
| bun, no change                                                               | exit 0  | runs, same findings                                   |

- The plugin works on ESLint 10 once installed, on the condition that `settings.react.version` is a
  literal: version detection calls an ESLint API that version 10 removed.
- Keeping it costs three additions: an `overrides` entry in the generated `package.json` (npm), a
  `peerDependencyRules` entry in the generated `pnpm-workspace.yaml` (pnpm), and an exemption in
  `scripts/pin-node-preset.mjs`, whose peer check otherwise steps ESLint down or throws.
- Not tested: rules outside the recommended set, and more than one source file. Another rule may call
  a removed API on a code path this file did not reach.

### React Compiler

- react.dev, "React Compiler" installation: "Install the ESLint plugin:
  `npm install -D eslint-plugin-react-hooks@latest`" and "The compiler rules are available in the
  `recommended-latest` preset." "When the ESLint rule reports an error, it means the compiler will
  skip optimizing that specific component or hook." The compiler has no ESLint plugin of its own, so
  the hooks plugin is how a compiler project sees what was skipped.
- The same page, for `@vitejs/plugin-react` 6 and later: `npm install -D @rolldown/plugin-babel`,
  then `plugins: [react(), babel({ presets: [reactCompilerPreset()] })]` with `reactCompilerPreset`
  imported from `@vitejs/plugin-react`. Version 6 removed the inline `babel` option the user's
  reference `vite.config.ts` uses.
- `create-vite` 9.3.4 has a `react-compiler-ts` variant ("TypeScript + React Compiler") that adds
  `babel-plugin-react-compiler` and writes that config.
- `create-vite`'s template asks for `typescript ~7.0.2`. The shared pin is 6.0.3, because
  `typescript-eslint` 8.72.2 accepts `typescript >=4.8.4 <6.1.0`.
- Not tested: an install of the compiler packages. `@rolldown/plugin-babel` 0.3.1 lists `rolldown`,
  `@babel/core`, `@babel/runtime` and `@babel/plugin-transform-runtime` as peers.

### Feature flags

- `@openfeature/react-sdk` 1.4.1 has two peers, `@openfeature/web-sdk ^1.9.0` and `react >=16.8.0`;
  `@openfeature/web-sdk` 1.10.0 has the peer `@openfeature/core ^1.12.0`. Three packages to pin.
- Its docs (openfeature.dev, React SDK, "release v1.4.1") document a `FeatureFlag` component
  ("conditionally renders its children based on feature flag evaluation", props `flagKey`,
  `defaultValue`, `matchValue`, `predicate`, `fallback`), the hooks `useFlag` and
  `useBooleanFlagValue`, an `OpenFeatureProvider` context provider, and a `TypedInMemoryProvider`
  registered with `OpenFeature.setProvider(...)`, whose flags are an object of
  `{ disabled, variants, defaultVariant, contextEvaluator }`.
- Not tested: an install on the four managers, the bundle size, and the SDK under React 19 with React
  Compiler.

### The reference the user meant by "site" and "refs cũ"

`dokploy/design-system/apps/site` (the user's design-system repository, outside this one), at
`949cb89`. It runs React 19.3.0, react-router 8.4.0, react-error-boundary 6.1.6, Vite 8.3.6 and
`@openfeature/react-sdk` 1.4.1, without the React Compiler plugin.

- `src/main.tsx`: `const bootstrap = async () => { … }` finds `#root`, creates the router, awaits
  `initFeatureFlags()`, renders `<App router={router} />`, and ends with `void bootstrap();`.
- `src/app.tsx`: nests `StrictMode`, `AppErrorBoundary`, a theme provider, `FeatureFlagsProvider` and
  `RouterProvider` (from `react-router/dom`) by hand.
- `src/contexts/FeatureFlags/`: `FeatureFlags.tsx` wraps `OpenFeatureProvider`;
  `FeatureFlags.config.ts` calls `OpenFeature.setProviderAndWait(new TypedInMemoryProvider(…))`
  raced against a 3000 ms timeout, so a slow provider never blocks the app.
- `src/router/`: `router.tsx` (`createBrowserRouter`, a `lazyPage` helper, a layout route with an
  `ErrorBoundary`, a `*` route) and `routes.constant.ts`.
- `src/hocs/{AuthGuard,GuestOnlyRoute}/`, `src/hooks/useAuth/`, `src/components/{AppErrorBoundary,
  RouteErrorBoundary,ErrorState,RootLayout}/`, `src/pages/{Home,Login,NotFound}/`,
  `src/services/{auth,error-reporting}.service.ts`. One folder per component, default exports.
- Its auth state is a hand-written `useSyncExternalStore` service, not zustand. It also carries
  language routes, deploy modes and a theme, none of which the user asked for here.
- No `Polymorphic` component exists in any of the user's repositories searched.

## Settled so far

- React Router 8.x in Data Mode: `createBrowserRouter` and `RouterProvider`, no Vite plugin, no SSR.
- ESLint stays at 10 for every preset, and `eslint-plugin-react` is not installed: no `overrides`,
  no `peerDependencyRules`, no exemption in the pin script. `eslint-plugin-react-refresh` and
  `eslint-plugin-react-hooks` are kept; the second carries the React Compiler rules.
- The stack is Vite, React, TypeScript and React Compiler, through the Babel preset.
- Modes follow nest: `init <dir> --framework react` and `init <dir> --monorepo --framework react`
  (app at `apps/react`); existing mode with `react` exits 1 before any write.
- Feature flags use `@openfeature/react-sdk` with its `TypedInMemoryProvider`, the flag values read
  from Vite environment variables (`VITE_FEATURE_<NAME>`). If the proof phase fails on the install,
  the bundle size or React Compiler, the fallback is a hand-written component on the same variables.
- The generated app has no test runner and no `test` script, as `create-vite` ships none. Init's own
  e2e proves it: install, lint, typecheck, build, and the routes answered by `vite preview`. Tests
  wait for the sample, with the four deferred libraries.
- The skeleton installs three of the listed libraries: `react-router`, `react-error-boundary` and
  `zustand`. `react-hook-form`, `@tanstack/react-query`, `@tanstack/react-table` and `tailwind` wait
  for a sample that `--no-sample` will drop; that sample is noted here and is not part of this plan.
- App state lives in zustand stores under `src/stores/`; the template writes no React context of
  its own. The one context in the tree is the SDK's: `@openfeature/react-sdk` 1.4.1 throws
  "Components using OpenFeature must be wrapped with an <OpenFeatureProvider>." without it.
- Where a context is used, it is read with React 19's `use(Context)`, never `useContext`. The
  template has no context of its own, so no generated file shows this yet. No lint rule enforces
  it; the convention is written in the docs only.
- No Tailwind, so the layout pieces are unstyled placeholders that print `Hello <X>`. Their job is to
  show the React Router base: a layout with `Outlet`, lazy pages, and the error cases (400, 404, 500,
  an error state).
- `src/main.tsx` wraps the mount in an async `bootstrap` function called as `void bootstrap();`, as
  `dokploy/design-system/apps/site/src/main.tsx` does. That is the "site" the user meant;
  `site/src/main.tsx` in this repository has no such function and is not changed.
- The template holds no binary file: `create-vite`'s `src/assets/hero.png` is dropped.
- `Providers`, `Polymorphic`, `AuthGuard` and `GuestOnlyRoute` are part of the preset, rewritten
  rather than copied from the reference.

## Outcome so far

```text
<project>/                 templates/react/ copied, plus the shared jss toolchain
├─ index.html, vite.config.ts, tsconfig*.json     from create-vite's react-compiler-ts variant
├─ eslint.config.mjs       the jss preset with browser globals, react-hooks and react-refresh
├─ .env.example            the VITE_FEATURE_<NAME> flags
└─ src/
   ├─ main.tsx             async bootstrap(): #root, router, initFeatureFlags, render; `void bootstrap();`
   ├─ app.tsx              App: Providers around RouterProvider
   ├─ components/
   │  ├─ Providers/        the provider tree: StrictMode, AppErrorBoundary, FeatureFlagsProvider
   │  ├─ Polymorphic/      the `as` prop component
   │  ├─ AppErrorBoundary/ react-error-boundary around the app
   │  ├─ RouteErrorBoundary/  the router's error element
   │  └─ ErrorState/       the shared error view
   ├─ contexts/FeatureFlags/   FeatureFlags.tsx and FeatureFlags.config.ts, as the reference
   ├─ layouts/             RootLayout (Outlet), Header, Footer, Sidebar, SideNav: print `Hello <X>`
   ├─ hocs/                AuthGuard/, GuestOnlyRoute/
   ├─ hooks/useAuth/       reads the zustand auth store
   ├─ stores/              the zustand auth store
   ├─ pages/               Home, Login, BadRequest (400), NotFound (404), ServerError (500)
   └─ router/              router.tsx (createBrowserRouter, lazyPage) and routes.constant.ts
```

One folder per component with a default export, as the reference does. Not carried over from the
reference: language routes, deploy modes, the theme and the design-system packages.

## Open

1. Whether the reference's `src/services/error-reporting.service.ts` comes along: the error
   boundary and the feature flag setup both call it.
2. What `--no-sample` does with `--framework react` while the sample is not built. Assumed: it keeps
   today's error.

## Deferred, not part of this plan

- The sample that `--no-sample` drops, with `react-hook-form`, `@tanstack/react-query`,
  `@tanstack/react-table` and `tailwind`.
- Tests in the generated app.
