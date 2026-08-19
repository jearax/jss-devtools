import { defineCommand } from 'citty';

import { displayBanner } from '@/utils/banner.js';
import { CLI_META } from '@/utils/constants.js';
import { logger } from '@/utils/logger.js';

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
  run() {
    displayBanner();
    logger.muted('');
    logger.muted(`Run \`${CLI_META.name} --help\` for available commands.`);
  },
});

export default routerCommand;
