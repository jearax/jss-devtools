import { defineCommand, renderUsage } from 'citty';

import routerCommand from '@/cli/router.js';
import { getBanner } from '@/utils/banner.js';
import { logger } from '@/utils/logger.js';

const helpCommand = defineCommand({
  meta: {
    name: 'help',
    description: 'Print usage information',
  },

  async run() {
    logger.raw(getBanner());
    logger.raw(await renderUsage(routerCommand));
  },
});

export default helpCommand;
