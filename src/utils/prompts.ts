import { confirm } from '@clack/prompts'

import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'

export const isTTY = (): boolean => Boolean(process.stdout.isTTY)

interface ConfirmOptions {
	json?: boolean
	yes?: boolean
	/**
	 * Destructive operations (e.g. uninstall) must not auto-proceed in
	 * non-interactive contexts — they require an explicit --yes instead.
	 */
	destructive?: boolean
}

export const confirmOrCancel = async (
	options: ConfirmOptions,
	prompt: string,
	jsonResult: object
): Promise<boolean> => {
	if (options.yes) {
		return true
	}

	if (!isTTY()) {
		// Reversible operations auto-proceed in non-TTY (CI-friendly, matches
		// pnpm self-update / bun upgrade precedent); destructive ones refuse.
		if (options.destructive) {
			const msg = 'This operation is destructive. Pass --yes to confirm in non-interactive mode.'

			if (options.json) {
				logger.json({
					...jsonResult,
					result: 'error',
					message: msg,
					error: {
						code: 'REQUIRES_CONFIRMATION',
						message: msg
					}
				})
			} else {
				logger.error(msg)
			}

			process.exitCode = 1

			return false
		}

		return true
	}

	const ok = await confirm({ message: prompt })

	if (!ok) {
		if (options.json) {
			logger.json(jsonResult)
		} else {
			logger.info(`Cancelled ${PKG_INFO.name} operation.`)
		}

		process.exitCode = 0
		return false
	}

	return true
}
