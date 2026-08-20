import { confirm } from '@clack/prompts';

import { logger } from '@/utils/logger';
import { PKG_INFO } from '@/utils/pkg';

export const isTTY = (): boolean => Boolean(process.stdout.isTTY);

interface ConfirmOptions {
  json?: boolean;
  yes?: boolean;
}

export const confirmOrCancel = async (options: ConfirmOptions, prompt: string, jsonResult: object): Promise<void> => {
  if (options.yes || !isTTY()) {
    return;
  }

  const ok = await confirm({ message: prompt });
  if (!ok) {
    if (options.json) {
      logger.json(jsonResult);
    } else {
      logger.info(`Cancelled ${PKG_INFO.name} operation.`);
    }

    process.exit(0);
  }
};
