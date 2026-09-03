---
'@jjuidev/jss-devtools': patch
---

Fix `init` generator to produce syntactically valid `eslint.config.mjs`.

- `node` preset: `globals.node` was emitted as a bare identifier (`globals: { globals.node }`), which is invalid object shorthand. Emit it as a spread (`...globals.node`) to match the `react` preset and the house `eslint.config.mjs`.
- generator template: the `newlines-between` key inside `import-x/order` was unquoted — a hyphenated key, also a syntax error. Quote it (`'newlines-between'`) to match the house reference.
- generator template: remove a stray closing brace that unbalanced the rules block (the previous bracket-only sanity check missed it).
- Add an AST-parse regression test so future template drift gets caught at unit-test time.
