import consola from 'consola';

import { detectGlobalPM } from '@/core/detector/global-pm';
import { logger } from '@/utils/logger';
import { PKG_INFO } from '@/utils/pkg';
import { confirmYes, isTTY } from '@/utils/prompts';

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

export const confirmOrCancel = async (options: CommonOptions, prompt: string, jsonResult: object): Promise<void> => {
  if (options.yes || !isTTY()) {
    return;
  }

  try {
    await confirmYes(prompt);
  } catch (err) {
    if (String(err).includes('USER_CANCELLED')) {
      if (options.json) {
        logger.json(jsonResult);
      } else {
        consola.info('Cancelled by user.');
      }
      process.exit(0);
    }
    throw err;
  }
};
