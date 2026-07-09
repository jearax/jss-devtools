import figlet from 'figlet';

import { CLI_META } from '@/utils/constants';
import { logger } from '@/utils/logger';

let cachedBanner: string | null = null;
let bannerDisplayed = false;

export const getBanner = (): string => {
	if (cachedBanner) {
		return cachedBanner;
	}

	try {
		cachedBanner = figlet.textSync(CLI_META.name, {
			font: 'Standard',
			horizontalLayout: 'default',
			verticalLayout: 'default'
		});
	} catch {
		cachedBanner = CLI_META.name;
	}

	return cachedBanner;
};

export const displayBanner = (): void => {
	if (bannerDisplayed) {
		return;
	}

	bannerDisplayed = true;

	const banner = getBanner();

	// Use raw output to preserve ASCII art (consola breaks multiline chars)
	logger.banner(banner);
	logger.tagline(CLI_META.tagline);
};
