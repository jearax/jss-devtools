import { defineCommand } from 'citty';

import { CLI_META } from '@/utils/constants.js';

const routerCommand = defineCommand({
  meta: {
    name: CLI_META.name,
    version: CLI_META.version,
    description: CLI_META.description,
  },
  subCommands: {
    version: () => import('@/commands/version.js').then((m) => m.default),
    help: () => import('@/commands/help.js').then((m) => m.default),
    // Phase 2: CLI self-management.
    update: () => import('@/commands/self/update.js').then((m) => m.default),
    upgrade: () => import('@/commands/self/upgrade.js').then((m) => m.default),
    downgrade: () => import('@/commands/self/downgrade.js').then((m) => m.default),
    uninstall: () => import('@/commands/self/uninstall.js').then((m) => m.default),
  },
  // No-op: parent run only fires when no subcommand matches AND no args parsed.
  // We handle banner/hint at top level (src/cli.ts) for predictable behavior.
  run() {},
});

export default routerCommand;
