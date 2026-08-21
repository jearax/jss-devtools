import { AgentName } from 'package-manager-detector'

import { logger } from '@/utils/logger'

export type CommandResultStatus = 'success' | 'noop' | 'cancelled' | 'error'

export interface BaseResult {
	schemaVersion: '1.0'
	pm: AgentName | null
	package: string
	dryRun: boolean
	message: string
}

export const baseResult = (pm: AgentName | null, pkg: string, dryRun: boolean): BaseResult => ({
	schemaVersion: '1.0',
	pm,
	package: pkg,
	dryRun,
	message: ''
})

export const printSuccess = (msg: string, dryRun: boolean): void => {
	logger.success(dryRun ? `[dry-run] ${msg}` : msg)

	if (!dryRun) {
		logger.info('💡 Restart your shell to refresh PATH cache.')
	}
}
