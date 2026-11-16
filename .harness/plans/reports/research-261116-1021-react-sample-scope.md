# Research: the react preset's --sample scope (not started)

Answered in conversation on 2026-11-16; recorded so the future brainstorm does not re-derive it.
The sample itself stays deferred exactly as
[decision 0057](../../decisions/0057-init-react-preset.md) records.

## Recommended shape, when the work starts

- Flag semantics mirror nest: the sample ships by default and `--no-sample` removes it, so one
  semantic covers every preset in help, docs and site.
- The sample is one feature domain (`courses`, matching nest's example domain) exercising the
  deferred libraries together: a list through `@tanstack/react-table`, a create/edit form through
  `react-hook-form`, data through `@tanstack/react-query` from an in-app mock service (the app
  keeps running offline), a `QueryClientProvider` through the provider-wrapper convention, plus
  route and SideNav entries. Tests in the generated app (vitest + Testing Library) ride with the
  sample, so `--no-sample` removes the test runner too.
- Tailwind is infrastructure, not sample: it touches vite.config, the root stylesheet and every
  layout's classes, so it belongs to the base preset; the other three libraries are sample-scoped
  and `--no-sample` removes them with their dependencies.

## What init must handle

1. File filtering on the nest `NO_SAMPLE` pattern.
2. Deterministic code edits with string anchors that throw on a missed match: the route object in
   `router.tsx`, the SideNav link, the query-client provider line in `APP_PROVIDERS`.
3. Manifest dependency removal for the sample-only packages; the pin script gains the sample list.
4. `--no-sample` accepts nest and react; help, `/docs/react` and its drift tests update.
5. e2e runs both branches (with and without `--no-sample`) across the four managers.

## Open decisions for the user, before planning

1. Sample on by default (mirror nest) or `--sample` opt-in — leaning: on by default.
2. Tailwind in the base preset or with the sample — leaning: base.
3. Sample domain name — leaning: `courses`, matching nest.
