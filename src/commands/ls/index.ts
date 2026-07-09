import { defineCommand } from 'citty'

import { displayBanner } from '@/utils/banner'
import { logger } from '@/utils/logger'

export const lsCommand = defineCommand({
	meta: {
		name: 'ls',
		description: 'List all available commands'
	},
	run: async () => {
		displayBanner()
		logger.text('Available commands:\n')

		logger.primary('ls')
		logger.muted('\t- List all available commands')

		logger.primary('init')
		logger.muted('\t- Initialize a new project')
	}
})
