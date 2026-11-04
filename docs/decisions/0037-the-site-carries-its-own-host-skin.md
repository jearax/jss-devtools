---
id: 0037
title: the landing page is one English page, and the site carries its own host skin
status: accepted
date: 2026-11-04
partially_supersedes: 0027
---

# 0037 The landing page is one English page, and the site carries its own host skin

## Context

Decision [0027](./0027-react-spa-landing-page.md) made the landing page a React single page
application and kept the content of the page it replaced: a title, a tagline, the install command,
the Node requirement and the repository link, in Vietnamese. Decision
[0036](./0036-site-runs-the-design-system-as-a-package.md) then made the site a host of the
design system, running Tailwind v4 and rendering the page inside the package's `ThemeProvider`.

What was left was a page that said almost nothing about the product. The CLI has three commands
and a harness, and the harness is the part nobody else ships: it makes an agent-driven repository
stay good over time, with the repository, not the chat context, as the authority. A reader who
lands on the page should learn that in a minute.

The design system owns the theme, but it is a library, and a library does not decide what a host
looks like. The package ships two skins, `default` and `spring`, and the host may carry its own: a
skin is a set of scale values, and `defineSkin` is the typing helper for it.

## Decision

**The page is one page, in English.** `site/index.html` declares `lang="en"`. (Since partly
superseded by [0038](./0038-the-site-has-a-router-and-a-docs-area.md): the site has a second route
for the docs, but the home page is still one page.) The page states the
product's real surface: the three commands with the output each one really prints, a terminal
transcript, the harness and the agent workflow, a reference section, the requirements and the
footer. Every value on the page comes from the built CLI or from the repository. Nothing is
invented: no logo wall, no testimonial, no comparison table, because the site has no customers to
show and the design system's quality floor forbids making them up.

**The site carries its own host skin.** `site/src/styles/skins/jss-devtools.css` declares scale
values only, under `:root[data-skin='jss-devtools']`, and it changes two scales: `primary`, to
signal teal, and `neutral`, to terminal graphite. The package's `secondary` and the four status
scales are inherited, because they carry meaning rather than brand. The values were derived by
converting the package's own scale values to OKLCH, rotating the hue and converting back under a
fixed WCAG relative luminance, so every contrast ratio in the package's contract is preserved
exactly. The package's checker holds the file to the same contract as the platform skins:

```bash
npx jds skin check src/styles/skins/jss-devtools.css --separation
```

**The skin is the page's default, and the rule is the same before the first paint and after it.**
The package resolves `data-skin` from the `jds-skin` cookie and falls back to the platform's
default skin. `site/index.html` therefore writes that cookie when it is absent, never overwrites a
stored choice, and writes the same `data-skin` attribute the provider will resolve, so the page
never shows the platform palette. The cookie is **host-only**: it carries `Path=/`, `SameSite=Lax`
and `Secure` over https, and no `Domain` attribute. A domain-wide cookie would make this site's
default skin a preference every other host on `jjuidev.com` would read, and the reader never
chose it. `initialPreferences` is not the way in: it is the server snapshot of
`useSyncExternalStore`, for a host that renders on a server, and the site is a client render.

**The site registers the skin with the package.** `defineSkin` names it, `ThemeProvider` receives
it in `skins`, and the `Register` augmentation makes `setSkin` typed for the host's own id.

## In the user's words

> "Palette: The site's own palette as a **host skin** made with `defineSkin` from the package" —
> the site has a palette of its own, expressed as a host skin. (user, 2026-11-04)

> "Language: **English only**; `lang="en"`" — the page is in English. (user, 2026-11-04)

> "Scope: A content-rich landing, **one page**" — one page, with the content a reader needs.
> (user, 2026-11-04)

## Options considered

| Option                                                        | Consequence                                                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the package's default palette                            | The smallest change and contract-clean, but the site has no palette of its own and the host-skin mechanism goes unused                          |
| Re-tint every scale                                           | The site would own the status colours too, and a status scale that changes with the brand stops meaning "this is a failure"                     |
| Put the palette in a host file under `:root`                  | The package's checker cannot validate it: it only reads a `:root[data-skin='<id>']` block, so the contract would pass against the wrong palette |
| Write the skin's values as `var(--color-primary-700)` aliases | The semantic layer would stop being the package's, and the platform's light and dark step contracts would be lost                               |
| Set `data-skin` from React only                               | The provider deletes the attribute on mount when the cookie is absent, so the page would flash the platform palette                             |
| Write the `jds-skin` cookie from the pre-paint script         | The cookie is written before the provider reads it, so the first paint and the provider agree (chosen)                                          |
| Write the cookie with a `Domain` attribute                    | Every other host on the domain would read this site's default skin as a preference the reader never chose                                       |

## Consequences

- The site ships a palette, and the package's contract governs it. `jds skin check` is the gate.
- The pre-paint script in `site/index.html` mirrors the package's cookie rule, because an inline
  script cannot import the package. The cookie it writes is host-only, so the site's default skin
  stays the site's own. The skin id
  therefore appears twice: in `site/src/styles/skins/jss-devtools.skin.ts` and in the script. A
  test holds them together.
- The site imports the package's platform skins through the package's Tailwind entry, so a stored
  `jds-skin` of another package skin still resolves to a real palette.
- The page's copy is a fact the CLI can be held to. The values live in the page's constants, and
  the CLI's output on the page was captured from the built CLI.
- The page is bigger: the JavaScript and the stylesheet grow with the sections. The numbers are in
  the plan's report.
- Enforced by: `npx jds skin check` (the skin's contract), the site's tests (the skin is applied,
  the id is the same in the document shell), `tests/install.test.ts` (the Node floor on the page
  equals `engines.node`) and the site's own lint, typecheck and test commands.
