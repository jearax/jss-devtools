// Top-level citty router for `jss-devtools` CLI.
// Defines meta (name/version/description) and a default `run` handler that prints
// a hint to use `--help`. Subcommands will be added in Phase 1+.
import { defineCommand } from 'citty';

import { logger } from '@/utils/logger.js';

const routerCommand = defineCommand({
  meta: {
    name: 'jss-devtools',
    version: '0.1.0',
    description: 'JavaScript stack dev tools CLI - inspired by Docker command-tree UX',
  },
  subCommands: {
    // Phase 1+: add `version`, `help`, `ls`, `update`, `upgrade`, `downgrade`, `scaffold`.
  },
  run() {
    // Default behavior when no subcommand provided: show usage hint.
    logger.info('jss-devtools — JavaScript stack dev tools CLI');
    logger.muted('');
    logger.muted('Run `jss-devtools --help` for available commands.');
  },
});

export default routerCommand;
