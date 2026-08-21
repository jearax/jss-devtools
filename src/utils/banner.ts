import figlet from 'figlet'

import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'

const BANNER_FONT = 'Standard'

let cachedBanner: string | null = null
let bannerDisplayed = false

export const getBanner = (): string => {
	if (cachedBanner !== null) {
		return cachedBanner
	}

	const fallback = (): string => PKG_INFO.name

	try {
		cachedBanner =
			figlet.textSync(PKG_INFO.name, {
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
