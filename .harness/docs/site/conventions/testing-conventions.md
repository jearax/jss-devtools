# Testing Conventions

> Adapted from `@jjuidev/design-system`'s `docs/conventions/testing-conventions.md`. The site has
> no end-to-end tests, no axe and no coverage gate, so the rules T8, T9 and T12 are left out.

## The Layer

| Layer              | Tool                                    | Where                    | Covers                              |
| ------------------ | --------------------------------------- | ------------------------ | ----------------------------------- |
| Unit and component | Vitest Browser Mode (headless Chromium) | `src/**/*.test.{ts,tsx}` | What a user can observe on the page |

`pnpm --dir site test` runs the suite; `pnpm --dir site test:watch` runs it in watch mode. The
browser is installed with `pnpm --dir site exec playwright install --with-deps chromium`, which CI
does before the suite runs.

## Rules

- **T1** A test sits next to its subject: `Home.test.tsx` next to `Home.tsx`.
- **T2** A test asserts behaviour, not implementation: it queries by role, label or text, never by
  class name or DOM structure.
- **T3** A test renders with `await render(...)` from `vitest-browser-react` and asserts with
  `expect.element(...)`. A snapshot of the whole page is never used.
- **T4** A locator matches the text exactly; a regular expression is used for a partial match.
- **T5** The test runs with `reducedMotion: 'reduce'`, which the browser provider sets, so a
  smooth scroll cannot stall the test iframe.
- **T6** The browser provider grants the clipboard permissions
  (`site/vitest.config.ts`), so a test that copies asserts against the real clipboard instead of
  mocking it.
- **T7** A part with no behaviour of its own is covered by the test of the page that composes it.
  The site has no snapshot convention, so a part is never pinned by a snapshot.
- **T8** A test that writes the `jds-skin` or `jds-theme` cookie resets it in the test, or the
  file order of a full run fails the next file that reads the theme. The design system's own site
  resets both cookies before every test; the site's `vitest.setup.ts` does not, so the test that
  writes a cookie clears it (stable `site-traps`).

```tsx
it('links to the source repository', async () => {
  const screen = await render(<Home />);

  await expect
    .element(screen.getByRole('link', { name: 'github.com/jearax/jss-devtools' }))
    .toHaveAttribute('href', 'https://github.com/jearax/jss-devtools');
});
```

A component that needs the theme wraps its render in the package's provider:

```tsx
const screen = await render(<Home />, { wrapper: ThemeProvider });
```
