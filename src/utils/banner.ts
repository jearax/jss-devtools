import { styleText } from 'node:util'

import figlet from 'figlet'

import { PKG_INFO } from '@/utils/pkg'

const renderBanner = (): string => {
	try {
		return figlet.textSync(PKG_INFO.bin, { font: 'Standard' })
	} catch {
		return PKG_INFO.bin
	}
}

// stdout: --help / --version output is the requested data, not a log line.
// citty's usage already prints the description, so only --version adds it.
export const printBanner = (options: { tagline?: boolean } = {}): void => {
	const tagline = options.tagline === true ? `${styleText('gray', PKG_INFO.description)}\n` : ''

	process.stdout.write(`${styleText('cyan', renderBanner())}\n${tagline}\n`)
}
