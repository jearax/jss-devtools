import figlet from 'figlet';

import { CLI_META } from '@/utils/constants.ts';
import { logger } from '@/utils/logger.ts';

let cachedBanner: string | null = null;
let bannerDisplayed = false;

export const getBanner = (): string => {
  if (cachedBanner !== null) {
    return cachedBanner;
  }

  try {
    cachedBanner = figlet.textSync(CLI_META.name, {
      font: CLI_META.bannerFont,
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });
  } catch {
    cachedBanner = CLI_META.name;
  }

  return cachedBanner;
};

export const displayBanner = (): void => {
  if (bannerDisplayed) return;
  bannerDisplayed = true;
  logger.raw(getBanner());
  logger.tagline(CLI_META.description);
};
