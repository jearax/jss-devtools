import figlet from 'figlet'

import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'

const BANNER_FONT = 'Standard'

// Render the bin name, not the scoped package name — "@jjuidev/jss-devtools"
// in figlet Standard is ~98 columns and breaks 80-column terminals.
const BANNER_TEXT = Object.keys(PKG_INFO.bin)[0] ?? PKG_INFO.name

let cachedBanner: string | null = null
let bannerDisplayed = false

export const getBanner = (): string => {
	if (cachedBanner !== null) {
		return cachedBanner
	}

	const fallback = (): string => BANNER_TEXT

	try {
		cachedBanner =
			figlet.textSync(BANNER_TEXT, {
				font: BANNER_FONT,
				horizontalLayout: 'default',
				verticalLayout: 'default'
			}) ?? fallback()
	} catch {
		cachedBanner = fallback()
	}

	return cachedBanner
}

export const displayBanner = (): void => {
	if (bannerDisplayed) {
		return
	}

	bannerDisplayed = true
	logger.raw(getBanner())
	logger.tagline(PKG_INFO.description)
}
