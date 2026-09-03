---
'@jjuidev/jss-devtools': patch
---

Polish `init` generator output to match the house `eslint.config.mjs` style.

- `eslint.config.mjs`: align indent across all `plugins: { ... }` entries — the `.join` separator used one extra tab, so the first entry was indented one level less than the rest.
- `commitlint.config.mjs`: wrap config in a named const (`const commitlintConfig = {...}`) before `export default`, matching the named-const wrapper used by `eslint.config.mjs`.
