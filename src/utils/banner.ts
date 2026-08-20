import figlet from 'figlet';

import { CLI_META } from '@/utils/constants';
import { logger } from '@/utils/logger';

let cachedBanner: string | null = null;
let bannerDisplayed = false;

export const getBanner = (): string => {
  if (cachedBanner !== null) return cachedBanner;

  const fallback = (): string => CLI_META.name;
  try {
    cachedBanner =
      figlet.textSync(CLI_META.name, {
        font: CLI_META.bannerFont,
        horizontalLayout: 'default',
        verticalLayout: 'default',
      }) ?? fallback();
  } catch {
    cachedBanner = fallback();
  }

  return cachedBanner;
};

export const displayBanner = (): void => {
  if (bannerDisplayed) return;
  bannerDisplayed = true;
  logger.raw(getBanner());
  logger.tagline(CLI_META.description);
};
