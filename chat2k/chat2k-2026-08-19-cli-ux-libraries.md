# CLI UX Libraries — @clack/prompts / consola / figlet / citty

> Ngày: 2026-08-19  
> Nguồn: github.com/natemoo-re/clack, github.com/unjs/citty, github.com/patorjk/figlet.js, npm registry  
> Ngữ cảnh: chọn libs cho CLI DX của `jss-devtools`

## TL;DR

**Stack đề xuất cho CLI SDK:**
- **@clack/prompts** — interactive prompts (text, confirm, select, multiselect, spinner)
- **consola** — structured logging (info/warn/error/success/box)
- **figlet** — ASCII banner (sparingly, welcome only)
- **citty** — arg parsing + command tree (zero-dep, lazy loading)

**Không pick cho CLI SDK MVP:**
- **ink** — React-based TUI, quá nặng cho SDK CLI (chỉ cần khi build full TUI app).
- **inquirer** — superseded bởi @clack/prompts.
- **chalk / picocolors standalone** — consola đã có colors built-in.

## @clack/prompts

**Tác giả:** natemoo-re (cũng maintain nanostores).  
**Stars:** 8k+.  
**Bundle:** ~15KB.

**Tại sao meta pick 2024-2026:**
- Opinionated, ready-to-use components (không phải building blocks).
- Được dùng bởi **create-vite, create-nuxt, shadcn-ui CLI, create-astro**.
- Modern UX: animations, spinners, groups.

**Components:**
```ts
import {
  text,        // single-line input
  password,    // masked input
  confirm,     // yes/no
  select,      // single choice (radio)
  multiselect, // multiple choice (checkboxes)
  spinner,     // async loading indicator
  group,       // multi-step flow
  groupMultiSelect, // multi-step with checkboxes
  cancel,      // handle cancellation
  isCancel,    // check if user cancelled
} from '@clack/prompts'
```

**Example:**
```ts
import * as p from '@clack/prompts'

const projectType = await p.select({
  message: 'Pick a project type.',
  options: [
    { value: 'ts-lib', label: 'TypeScript Library' },
    { value: 'node-cli', label: 'Node.js CLI' },
    { value: 'ts-svc', label: 'TypeScript Service' },
  ],
})

if (p.isCancel(projectType)) {
  p.cancel('Operation cancelled.')
  process.exit(0)
}
```

**Critical: TTY detection**
```ts
// KHÔNG trigger prompts trong CI hoặc piped output
if (!process.stdout.isTTY) {
  // Force error or auto-default
}
```

Có thể dùng `is-interactive` package hoặc check `process.stdout.isTTY`.

## consola

**Tác giả:** unjs team (Nuxt, nitro).  
**Stars:** n/a (bundled với Nuxt nên metric khác).  
**Bundle:** ~15KB.

**Tại sao chọn thay vì console.log/picocolors/chalk:**
- **Built-in levels** (trace/debug/info/success/warn/error/fatal) → tự động handle verbosity.
- **Scoped loggers** — `consola.withTag('cli')` prefix mọi log.
- **Box formatting** — `consola.box()` cho ASCII boxes.
- **Start/Ready/Success tags** — built-in emoji + colors.
- **Silent mode** — `consola.level = 0` cho CI hoặc quiet mode.

**Wrapper pattern (recommended):**
```ts
// src/utils/logger.ts
import consola from 'consola'
import { colors } from 'consola/utils'

export const logger = {
  error: (msg: string) => consola.error(msg),
  success: (msg: string) => consola.success(msg),
  info: (msg: string) => consola.info(msg),
  warn: (msg: string) => consola.warn(msg),
  log: (msg: string) => consola.log(msg),
  
  primary: (msg: string) => consola.log(colors.cyan(msg)),
  secondary: (msg: string) => consola.log(colors.magenta(msg)),
  muted: (msg: string) => consola.log(colors.gray(msg)),
  
  box: (msg: string) => consola.box(msg),
  start: (msg: string) => consola.start(msg),
  ready: (msg: string) => consola.ready(msg),
  
  // Raw output - bypass consola cho ASCII art (consola breaks multiline chars)
  raw: (msg: string) => console.log(msg),
  banner: (msg: string) => console.log(colors.cyan(msg)),
}
```

**Why raw for ASCII art:** consola có thể break multiline chars (figlet output). Bypass qua `console.log` raw.

## figlet

**Tác giả:** patorjk (figlet.js).  
**Stars:** 3k+.  
**Bundle:** fonts là heavy (~1MB tổng). **Bundle chỉ 1 font** qua `figlet/fonts/<name>.flf` import.

**Use case CLI SDK:**
- Welcome banner (`jss-devtools --version`).
- Optional splash khi first run.

**KHÔNG nên lạm dụng:** Splash mỗi command → annoying. Reserve cho:
- Top-level help output.
- Welcome screen lần đầu.
- Version command.

**Usage:**
```ts
import figlet from 'figlet'

const banner = figlet.textSync('jss-devtools', {
  font: 'Standard',       // 150+ fonts available
  horizontalLayout: 'default',
  verticalLayout: 'default',
})
// Output:
//   _                              _     ____                          _   _           
//  (_)___  ___ _ ____   _____ _ __| |_  |  _ \  ___  _ __ ___   __ _ _ _| |_| |__  _   _ 
//  | / __|/ _ \ '__\ \ / / _ \ '__| __| | | | |/ _ \| '_ ` _ \ / _` | '__| __| '_ \| | | |
//  | \__ \  __/ |   \ V /  __/ |  | |_  | |_| | (_) | | | | | | (_| | |  | |_| | | | |_| |
//  |_|___/\___|_|    \_/ \___|_|   \__| |____/ \___/|_| |_| |_|\__,_|_|   \__|_| |_|\__, |
//                                                                                    |___/ 
```

**Cache banner:**
```ts
let cachedBanner: string | null = null

export const getBanner = (): string => {
  if (cachedBanner) return cachedBanner
  try {
    cachedBanner = figlet.textSync('jss-devtools', { font: 'Standard' })
  } catch {
    cachedBanner = 'jss-devtools'  // fallback nếu font load fail
  }
  return cachedBanner
}
```

**Font loading:** nếu dùng nhiều fonts, copy từ `node_modules/figlet/fonts/` vào `dist/fonts/` lúc build.

## citty

**Tác giả:** unjs team.  
**Stars:** 1.3k.  
**Bundle:** ~3KB (zero deps).

**Tại sao chọn cho CLI SDK:**
- **Zero-dependency** — dùng native `util.parseArgs` (Node 18+).
- **Lazy loading subcommands** — CLI chỉ load subcommand khi cần → startup nhanh.
- **Declarative API** — `defineCommand({ meta, args, subCommands, run })`.
- **Auto-generated usage** — `--help` tự build từ meta + args.

**Comparison với commander:**
| Tiêu chí | commander | citty |
|---|---|---|
| Stars | 28.4k | 1.3k |
| Dependencies | vài | 0 |
| ESM-first | ✅ | ✅ |
| Lazy subcommands | ❌ | ✅ |
| Bundle size | medium | tiny |
| API style | OOP `program.command()` | Declarative `defineCommand` |

**Example:**
```ts
import { defineCommand, runMain } from 'citty'

const main = defineCommand({
  meta: {
    name: 'jss-devtools',
    version: '0.1.0',
    description: 'JS stack dev tools CLI',
  },
  subCommands: {
    version: () => import('./commands/version').then(m => m.versionCommand),
    ls: () => import('./commands/ls').then(m => m.lsCommand),
    update: () => import('./commands/update').then(m => m.updateCommand),
    // ...
  },
  run: async () => {
    // Default: show help
    console.log('Run jss-devtools --help for available commands.')
  },
})

runMain(main)
```

**Auto-handled flags:**
- `--help` / `-h` → in usage.
- `--version` / `-v` → in version.

## Khi nào pick cái gì

| Need | Pick |
|---|---|
| Interactive input | @clack/prompts |
| Structured logging | consola |
| ASCII banner | figlet |
| CLI arg parsing | citty |
| Color (standalone) | picocolors (consola đã có) |
| Full TUI (multi-pane, layout) | ink (React-based) |
| Old-school prompts | inquirer (superseded) |
| Spinner đơn giản | ora (nếu không dùng clack) |
| Update notifications | update-check |

## Decision cho `jss-devtools`

**Stack:**
- @clack/prompts (interactive flows trong `scaffold init`)
- consola (wrap trong `src/utils/logger.ts`)
- figlet (chỉ welcome banner, optional)
- citty (top-level routing)

**Không pick:**
- ink (YAGNI cho SDK CLI MVP — chỉ cần nếu Phase 5+ có TUI mode)
- inquirer (superseded)
- chalk/picocolors standalone (consola đủ)

## Related Notes

- [[2026-08-19-js-bundlers]] — bundler choice.
- [[2026-08-19-package-managers]] — pnpm choice.
