import { defineCommand } from 'citty';

import { detectGlobalPM } from '@/core/global-pm-detector/index.js';
import { logger } from '@/utils/logger.js';

import { fetchAndDisplayUpdates } from './update.js';

const updateCheckCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Show 5 latest stable versions of jss-devtools',
  },
  args: {
    json: {
      type: 'boolean',
      description: 'Output structured JSON',
      default: false,
    },
  },
  async run({ args }) {
    const detected = await detectGlobalPM('jss-devtools');
    const current = detected?.version ?? '0.0.0';
    try {
      await fetchAndDisplayUpdates('jss-devtools', current, args.json === true);
    } catch (err) {
      logger.error(`Failed to fetch versions: ${String(err)}`);
      process.exit(2);
    }
  },
});

export default updateCheckCommand;
