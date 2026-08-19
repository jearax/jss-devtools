import { defineCommand } from 'citty';

import { CLI_META } from '@/utils/constants.js';

const routerCommand = defineCommand({
  meta: {
    name: CLI_META.name,
    version: CLI_META.version,
    description: CLI_META.tagline,
  },
  subCommands: {
    // Phase 2+: add `ls`, `update`, `upgrade`, `downgrade`, `scaffold`.
    version: () => import('@/commands/version.js').then((m) => m.default),
    help: () => import('@/commands/help.js').then((m) => m.default),
  },
  // No-op: parent run only fires when no subcommand matches AND no args parsed.
  // We handle banner/hint at top level (src/cli.ts) for predictable behavior.
  run() {},
});

export default routerCommand;
