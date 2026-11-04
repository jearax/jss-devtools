# Component Conventions

> Adapted from `@jjuidev/design-system`'s `docs/conventions/component-conventions.md`. The site
> has no shared component library yet, no component catalog and no Storybook, so the parts about
> publishing, cataloguing and snapshotting a shared component are left out.

## Folder Anatomy

```text
pages/Home/
├── Home.tsx             # the component; default export
├── Home.constant.ts     # the site's own facts: the name, the install command, the Node floor
├── Home.test.tsx        # the test; sits next to the component
├── styles.module.css    # the component's styles
├── constants/           # the page's content, one file per group of values
│   ├── commands.constant.ts
│   ├── harness.constant.ts
│   └── reference.constant.ts
└── components/          # the page's own components, one folder each
    └── InstallCommand/
        ├── InstallCommand.tsx
        ├── InstallCommand.test.tsx
        └── styles.module.css
```

A page that outgrows one screen splits into components under `components/<Name>/`. The page
component then only composes them; it holds no markup of its own beyond the landmarks.

## Fixed Values

- A value the page shows once — a command, a URL, a version floor, a label — lives in the page's
  `<Name>.constant.ts` as an UPPER_SNAKE_CASE constant. A component reads it; it never writes it
  out again.
- A page whose values outgrow one file splits them into `constants/`, one `<name>.constant.ts` per
  group: the commands and the terminal, the harness, the reference. The page's own facts stay in
  `<Name>.constant.ts`, because the root test reads the Node floor from there.
- A constant that is also a fact about the repository (the Node floor) is read from there by the
  root test, so the page and `package.json` cannot drift apart.

## The Design System's Components

- A component the design system already ships is used from the package: `ThemeToggle` and `Logo`
  come from `@jjuidev/design-system`. Nothing is reimplemented in the site.
- The page owns its layout around those components; the package owns their behaviour and their
  styles.

## Component API

- A component's props come from the element it renders: `ComponentProps<'main'>` for a `<main>`,
  never a hand-copied type.
- Props that forward to an element are declared as an `interface` extending `ComponentProps`, so
  `extends` reports a conflicting member where an intersection would silently make it `never`.
- A component that forwards `...props` accepts a `className`; it merges it with `cn` from
  `@jjuidev/design-system`, so a consumer class never replaces the component's own.
- Every component declares and exports its props type, so the next prop has a place to land.

```tsx
export interface HomeProps extends ComponentProps<'div'> {}
```

## Component Code

- A component is an arrow function with a block body and an explicit `return`. No `function`
  declaration and no implicit return; ESLint enforces both.
- The component is declared as a constant and default-exported, so the export line names it.
- A page or a component is default-exported. Everything else is a named export.
- The rest spread `{...props}` goes last on the element, so what the consumer passes is their
  intent and overrides anything the component sets.
- State and props reach the CSS through `data-*` attributes and selectors. Any other conditional
  class goes through `cn`'s object syntax, never a ternary, a template string or `&&`.

## Styling

- The outermost wrapper class is `.root`; the other classes are camelCase (`.installCommand`).
- The custom styles live in `styles.module.css` and use `@apply`; see
  [styling-conventions.md](styling-conventions.md).
- A Tailwind class string never appears in JSX. It belongs in a `variants.ts` next to the
  component, built with `tv()` from `@jjuidev/design-system`. The site has no `variants.ts`
  yet: the only page styles through its CSS Module.

```tsx
const Home = ({ className, ...props }: HomeProps) => {
  return (
    <div className={cn(styles.root, className)} {...props}>
      <SiteHeader />
      <main className={styles.main}>
        <Hero />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Home;
```
