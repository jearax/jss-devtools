---
id: 0027
title: the landing page is a React SPA built by Vite, the design system is vendored as a tarball
status: partly superseded
date: 2026-11-03
supersedes: 0021
partially_superseded_by: [0036, 0037]
---

# 0027: the landing page is a React SPA built by Vite, the design system is vendored as a tarball

## Context

Decision [0021](./0021-temporary-nginx-home-and-install-script-location.md) made the home page a
single static file, `docker/home.html`, copied into the nginx image. It called the page temporary
on purpose: a content site, more languages and a design system would each need their own plan.
This is that plan.

> **Partly superseded** by [0036](./0036-site-runs-the-design-system-as-a-package.md): the styling
> entry and the component-import rules changed. The single page application, the vendored tarball,
> the content of the page and the CI build order still stand.
>
> **Partly superseded** by [0037](./0037-the-site-carries-its-own-host-skin.md): the content of the
> page and its language changed. The page is one English page with the product's real surface, and
> it runs the site's own host skin. The single page application, the vendored tarball and the CI
> build order still stand.

The user wants the introduction site built with React, and the design system to be part of it. The
design system, `@jjuidev/design-system`, lives in another repository and is not published to a
registry, so the site cannot install it the way every other dependency is installed.

The page itself carries four things: a title, a tagline, the install command, the Node
requirement and the repository link. The user set the scope as "Hello world": the same content as
the page it replaces, no new interface.

## Decision

**The home page is a React single page application, built by Vite in `site/`.** `site/` is a
separate pnpm project: its own lockfile, its own `pnpm-workspace.yaml`, outside the CLI workspace
and outside the CLI bundle. It has no router and no prerendering, so the page is a client render
and the served HTML carries no content for a crawler. The user accepted that trade.

**The design system is vendored as a tarball.** `pnpm pack` in the design system repository
produces `site/vendor/jjuidev-design-system-0.1.0.tgz`, and the site installs it as
`file:vendor/jjuidev-design-system-0.1.0.tgz`. The tarball is committed, so the build needs no
registry and no network to the design system. Only `@jjuidev/design-system/styles.css` is
imported: the core brand tokens, the colour palette and the font stack. No component JavaScript is
imported, so the design system's component runtime never reaches the bundle.

**The page keeps the content of the old page.** Title, tagline, the install command, the Node
requirement, the note about `~/.local/bin/jss-devtools` and `PATH`, and the GitHub link. The
design system supplies the colours and the font through its tokens; the layout is the same.
(Since partly superseded by [0037](./0037-the-site-carries-its-own-host-skin.md): the page now
states the product's real surface and is in English.)

**Dark mode follows the operating system.** The design system keeps its dark palette behind the
`[data-theme=dark]` attribute, so `site/index.html` sets that attribute before the first paint
when the system asks for a dark scheme. The page follows the same preference the static page
followed through `color-scheme: light dark`, and the palette stays in one place.

**CI builds the site before it builds the image.** The `image` job installs and builds `site/`, and
the image copies `site/dist/` instead of a page file. The server still never builds anything. The
assets are served under `/assets/` with an immutable cache, because Vite puts a content hash in
their names.

## In the user's words

> "Làm trang web giới thiệu bằng React" — the introduction site is a React application, not a
> static page. (user, 2026-11-03)

> "Vendor design system dạng local pack" — the design system is packed locally and installed from
> the tarball, because it is not published to a registry. (user, 2026-11-03)

> "React SPA 'Hello world': nội dung giống hệt trang cũ, không UI mới, không router" — the scope is
> the old content, no new interface, no router. (user, 2026-11-03)

## Options considered

| Option                                  | Consequence                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| React SPA built by Vite (chosen)        | The page is an application the repository can grow; the image gains a build step and an asset route                              |
| Keep the static page                    | The previous state: one file, no build. Replaced at the user's request                                                           |
| Prerender or static generation          | Keeps the content in the served HTML; adds a plugin and a second rendering path the user did not ask for                         |
| Publish the design system to a registry | A cleaner install, but the package belongs to another repository and publishing it is a decision of its own                      |
| Import the design system components     | Pulls the component runtime and its dependency tree into the bundle; only the brand tokens are needed                            |
| Put the site in the CLI workspace       | One lockfile and one install, but React and Vite would sit in the CLI project and the architecture rules would have to know them |

## Consequences

- The image carries `site/dist/` instead of a page file: the routing table gains `/assets/`, and
  the smoke test proves the asset route answers 200 with an immutable cache.
- The site is a second pnpm project. The root ESLint configuration lints `site/src`, so CI installs
  the site's dependencies before it lints, and the root `tsconfig.json` excludes `site/`.
- The vendored tarball installs the design system's own runtime dependencies even though only the
  stylesheet is used. The bundle is unaffected, because only CSS is imported.
- The served HTML is nearly empty: the content appears after the client renders it. Search engines
  and link previews see the shell. This was a non-goal the user accepted.
- The design system version is pinned by the tarball in `site/vendor/`. A new design system
  release means a new pack and a new commit, not a version bump.
- The Node floor stays in one place: the root `package.json`. The site declares no `engines`, so
  the floor does not have to be changed in two files.
- Enforced by: `ci/smoke-site-image.sh` (the asset route answers 200 with `immutable`, and an
  unknown asset answers 404) and `tests/install.test.ts` (the Node floor on the page equals
  `engines.node`).
