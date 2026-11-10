# Component Conventions

> Adapted from the stable design system's `.harness/docs/component-conventions.md` and its
> decisions 0031, 0045, 0046. The site has no shared component library yet, no component catalog
> and no Storybook, so the parts about publishing and cataloguing a shared component are left
> out.

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

- A component the design system already ships is used from the package: `ThemeProvider`,
  `Button`, `Logo`, `ThemeToggle`, `ButtonCopy`, `Dialog` and `Popover` come from
  `@jjuidev/react`; `cn` comes from `@jjuidev/styles/variants`; `defineSkin` comes from
  `@jjuidev/styles/theme`. Nothing is reimplemented in the site where the package's component
  looks and behaves the same.
- The page owns its layout around those components; the package owns their behaviour and their
  styles. Where the site re-implements something the package ships (its own `CopyButton`, the
  search palette's shell), the site's own component wins until the package's version can replace
  it without changing the look.

## Component API

- A component's props come from the element it renders: `ComponentProps<'main'>` for a `<main>`,
  never a hand-copied type.
- Props that forward to an element are declared as an `interface` extending `ComponentProps`, so
  `extends` reports a conflicting member where an intersection would silently make it `never`.
- **Destructuring order** (stable 0046): `children`, `ref`, `id`, `className`, variant props,
  other props, `on*` handlers, then `...props` last. Leave out what the component does not use.
- Copy never cites a decision number or a `.harness/` path (stable 0048): the sentence states the
  rule itself. Decision numbers stay in code comments, `.harness/` docs and commit messages.
- A component that forwards `...props` accepts a `className`; it merges it with `cn` from
  `@jjuidev/styles/variants`, so a consumer class never replaces the component's own.
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
- An optional element renders with `{value && <Element />}`; compare explicitly only when the left
  side can be `0`. Attributes that share one condition are built once as an object and spread, not
  one ternary each. A single conditional attribute may stay inline. Decision 0043.

## Styling

- The outermost wrapper class is `.root`; the other classes are camelCase (`.installCommand`).
- The custom styles live in `styles.module.css` and use `@apply`; see
  [styling-conventions.md](styling-conventions.md).
- A Tailwind class string never appears in JSX. It belongs in a `variants.ts` next to the
  component, built with `tv()` from `@jjuidev/styles/variants`. The site has no `variants.ts`
  yet: the only page styles through its CSS Module.

```tsx
const Home = ({ className, ...props }: HomeProps) => {
  return (
    <div className={cn(styles.root, className)} {...props}>
      <Hero />
      <CommandsBand />
      <FileTree className={styles.tree} />
    </div>
  );
};

export default Home;
```
