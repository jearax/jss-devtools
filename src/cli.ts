// Bin entry — injected by tsup banner config, do not duplicate shebang here.
//
// intercepts --help/-h before runMain because Citty 0.2.x exposes no custom
// help renderer (verified via citty source: only `meta.description` / `arg.*`
// fields customize output; `help: { render }` is silently ignored).
import { renderUsage, runMain } from 'citty';

import routerCommand from '@/cli/router.js';
import { getBanner } from '@/utils/banner.js';
import { logger } from '@/utils/logger.js';

process.on('uncaughtException', (err) => logger.error(String(err)));
process.on('unhandledRejection', (err) => logger.error(String(err)));

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  logger.raw(getBanner());
  logger.raw(await renderUsage(routerCommand));
  process.exit(0);
}

runMain(routerCommand);
