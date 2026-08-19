import routerCommand from '@/cli/router.js';
import { logger } from '@/utils/logger.js';
// Bin entry — invoked by `jss-devtools` command (resolved via package.json `bin` field).
// Delegates to citty router for arg parsing + command dispatch.
// Shebang `#!/usr/bin/env node` is injected by tsup banner config — do not duplicate here.
import { runMain } from 'citty';

// Surface unexpected runtime errors via consola instead of silent stderr.
process.on('uncaughtException', (err) => logger.error(String(err)));
process.on('unhandledRejection', (err) => logger.error(String(err)));

runMain(routerCommand);
