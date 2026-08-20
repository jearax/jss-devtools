import { defineCommand, renderUsage } from 'citty';

import routerCommand from '@/cli/router';
import { getBanner } from '@/utils/banner';
import { logger } from '@/utils/logger';

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
