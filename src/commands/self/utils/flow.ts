import { detectGlobalPM } from '@/core/detector/global-pm';
import { logger } from '@/utils/logger';
import { PKG_INFO } from '@/utils/pkg';

import type { DetectedPM } from '@/core/detector/types';

interface CommonOptions {
  json?: boolean;
  yes?: boolean;
}

export const requireGlobalPM = async (options: CommonOptions): Promise<DetectedPM> => {
  const detected = await detectGlobalPM(PKG_INFO.name);
  if (detected) {
    return detected;
  }
  const msg = `${PKG_INFO.name} not installed via any known package manager. Install via npm/pnpm/yarn/bun.`;
  if (options.json) {
    logger.json({
      schemaVersion: '1.0',
      result: 'error',
      error: { code: 'PM_NOT_DETECTED', message: msg },
    });
  } else {
    logger.error(msg);
  }
  process.exit(1);
};
