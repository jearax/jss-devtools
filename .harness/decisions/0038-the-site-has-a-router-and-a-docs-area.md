---
id: 0038
title: the site has a router, and the docs are a second route beside the home page
status: accepted
date: 2026-11-04
partially_supersedes: 0037
---

# 0038 The site has a router, and the docs are a second route beside the home page

## Context

The site was a single page application with one route and no router
([0027](./0027-react-spa-landing-page.md), [0036](./0036-site-runs-the-design-system-as-a-package.md)).
The product grew past what one page can hold: the three commands, the harness and the agent
workflow, a reference, and the install guide are different kinds of writing, and a reader who wants
the reference should not scroll past the pitch to reach it.

The user asked for it directly: "chia routers, có menu, docs" — routers, a menu, docs.

## Decision

**The site has a router.** `react-router`, pinned to an exact version on the same major the design
system's own `main` branch uses. Two routes: `/` is the home page and `/docs` is the docs area,
with one path per docs page. An unknown path renders a not-found view inside the app.

**The docs area is lazy, route by route.** The router matches the paths before it loads anything, so
a lazy route cannot bring its own children: the route tree has to be static. The docs area is
therefore a set of lazy routes — the layout, the sidebar and each page are loaded on demand, and
each is its own chunk. A visitor who never opens the docs never downloads them.

**Every docs page has exactly one address.** `/docs` redirects to `/docs/getting-started`, so the
sidebar can mark the current page, the previous/next links can be computed, and no page has two
URLs.

**The routes and the sidebar order live in one constant.** `site/src/constants/routes.constant.ts`
holds the six docs pages with their slugs, titles and summaries, and the header's navigation. The
sidebar, the previous/next links and the router all read it, so they cannot drift apart.

**Every page is the same shape.** A breadcrumb, the title and one line of what the page answers, an
on-page table of contents for the pages long enough to need one, the content, and the previous and
next links. The sidebar is sticky on a wide viewport and a row of chips below the `lg` breakpoint.
The current page is marked with `aria-current="page"`, which `NavLink` sets.

**The facts both routes state live in `site/src/constants/`.** The install command, the Node floor,
the commands, the harness hooks, the init options and the exit codes are stated by the home page
and by the docs area, so they live in the shared constants and both read them. A page's own words
stay in the page.

**The route tree is built fresh for every router.** The router consumes a route object as it loads
it, so a shared tree would hand the second router a tree with its thunks already spent. The routes
are a factory, not a constant.

**The server serves the shell for the docs.** `docker/nginx.conf` answers `/docs` and every path
under it with `index.html`, so a docs page survives a reload. Every other unknown path still answers
404, and the smoke test covers both.

**The shared parts moved out of the page.** The header, the footer, the layout shell, the terminal
and the code block live in `site/src/components/`, and the shared constants in
`site/src/constants/`. A component used by two routes belongs to neither.

## In the user's words

> "chia routers, có menu, docs" — routers, a menu, docs. (user, 2026-11-04)

> "Docs source: React components plus constants, written from the CLI's real output. No Markdown/MDX
> pipeline" — the docs are components, not a build step. (user, 2026-11-04)

## Two things the implementation decided

**The call to actions are links, not the design system's `Button`.** The package's `Button` is a
`<button>` with no `asChild`, and a navigation call to action has to be a real link. The links carry
the package's semantic tokens and its focus ring, so they look like its button and behave like a
link. The follow-up for the design system is a `Button` that can render an anchor, or a
`ButtonLink`.

**The unused `@font-face` rules stay.** The variable family publishes no latin-only stylesheet, so
every subset's rule lands in the stylesheet, and the browser only downloads the latin file. Writing
the latin rule by hand would mean copying the package's file layout, which drifts on the next bump.
The 3.9 kB is the price of not reaching into the package.

## Options considered

| Option                                                | Consequence                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| One page, with the docs as a section (chosen before)  | The reference is below the pitch; a reader who wants the options scrolls past the marketing |
| A Markdown pipeline for the docs                      | A second build, a second content source, and a second thing that can drift from the CLI     |
| The docs as a separate site                           | Two deployments, two domains, two headers, and the reader leaves the landing page           |
| The router with the docs in the home bundle           | The home route ships the docs; the landing page's JavaScript grows by the size of the docs  |
| The router with the docs lazy route by route (chosen) | The home route ships a few import thunks and none of the docs                               |

## Consequences

- The site has a dependency it did not have: `react-router`, pinned like every other one.
- The data router is the heavy one: it costs about 20 kB gzip more than the plain router, measured
  on its own with react excluded (34.87 kB gzip against 14.66 kB). The plain router has no
  route-level lazy discovery, so the docs would have to be split with `React.lazy` instead. The
  trade is accepted: the router is the design system's own choice, and the docs stay out of the
  landing page's bundle. The number is written down here so the trade is a decision and not an
  accident.
- The not-found view is part of the app, so a mistyped path gets a page rather than nginx's 404.
- The image serves one file for several paths, so the image's route table is the nginx one.
- The shared components are shared, so a change to the header reaches the docs too.
- Enforced by: the site's own tests (the routing, the menu, the sidebar's active state, the docs
  facts) and `ci/smoke-site-image.sh` (`/docs` and a docs page answer 200, `/nope` still 404).
