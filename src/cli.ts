// Bin entry — injected by tsup banner config, do not duplicate shebang here.
//
// intercepts --help/-h and --version/-v before runMain because:
// 1. Citty 0.2.x exposes no custom help renderer (verified via citty source).
// 2. Citty's auto --version just prints meta.version (no banner); we want branded.
import { runMain } from 'citty';

import { renderHelp } from '@/cli/help.js';
import routerCommand from '@/cli/router.js';
import { getBanner } from '@/utils/banner.js';
import { CLI_META } from '@/utils/constants.js';
import { logger } from '@/utils/logger.js';

process.on('uncaughtException', (err) => logger.error(String(err)));
process.on('unhandledRejection', (err) => logger.error(String(err)));

const args = process.argv.slice(2);
const isHelp = args.includes('--help') || args.includes('-h');
const isVersion = args.includes('--version') || args.includes('-v');

if (isHelp) {
  logger.raw(await renderHelp());
  process.exit(0);
}

if (isVersion) {
  logger.raw(getBanner());
  logger.raw(CLI_META.version);
  process.exit(0);
}

runMain(routerCommand);
