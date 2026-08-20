// Shared flow helpers for self commands:
// - requireGlobalPM: detect + handle "not found" with json/text output + exit
// - confirmOrCancel: confirm prompt + handle user cancel with json/text output + exit
import consola from 'consola';

import { detectGlobalPM } from '@/core/detector/global-pm';
import { logger } from '@/utils/logger';
import { PKG_INFO } from '@/utils/pkg';
import { confirmOrThrow, isTTY } from '@/utils/prompts';

import { printJson } from '@/commands/self/utils/output';
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
    printJson({
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
    await confirmOrThrow(prompt);
  } catch (err) {
    if (String(err).includes('USER_CANCELLED')) {
      if (options.json) {
        printJson(jsonResult);
      } else {
        consola.info('Cancelled by user.');
      }
      process.exit(0);
    }
    throw err;
  }
};
