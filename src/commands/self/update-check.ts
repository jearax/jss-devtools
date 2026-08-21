import { defineCommand } from 'citty'

import { fetchAndDisplayUpdates } from '@/commands/self/update'
import { detectGlobalPM } from '@/core/detector/global-pm'
import { logger } from '@/utils/logger'

const updateCheckCommand = defineCommand({
	meta: {
		name: 'check',
		description: 'Show 5 latest stable versions of jss-devtools'
	},
	args: {
		json: {
			type: 'boolean',
			description: 'Output structured JSON',
			default: false
		}
	},
	run: async ({ args }) => {
		const detected = await detectGlobalPM('jss-devtools')
		const current = detected?.version ?? '0.0.0'

		try {
			await fetchAndDisplayUpdates('jss-devtools', current, args.json === true)
		} catch (err) {
			logger.error(`Failed to fetch versions: ${String(err)}`)
			process.exitCode = 2

			return
		}
	}
})

export default updateCheckCommand
