import { defineCommand, renderUsage } from 'citty';

import routerCommand from '@/cli/router.ts';
import { getBanner } from '@/utils/banner.ts';
import { logger } from '@/utils/logger.ts';

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
