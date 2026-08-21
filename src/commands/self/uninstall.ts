import { defineCommand } from 'citty'

import { extractSelfArgs } from '@/commands/self/utils/args'
import { requireGlobalPM } from '@/commands/self/utils/flow'
import { CommandResultStatus, baseResult, printSuccess } from '@/commands/self/utils/result'
import { execOrDryRunRemove } from '@/core/self-installer/exec'
import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'
import { confirmOrCancel } from '@/utils/prompts'

const uninstallCommand = defineCommand({
	meta: {
		name: 'uninstall',
		description: 'Uninstall CLI from global'
	},
	args: {
		yes: {
			type: 'boolean',
			description: 'Skip confirmation prompt',
			default: false,
			alias: 'y'
		},
		'dry-run': {
			type: 'boolean',
			description: 'Print command without executing',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'Output structured JSON',
			default: true
		}
	},
	run: async ({ args }) => {
		const { dryRun, json: jsonMode, yes } = extractSelfArgs(args)

		const promptOptions = {
			json: jsonMode,
			yes
		}

		const detected = await requireGlobalPM(promptOptions)

		await confirmOrCancel(promptOptions, `Uninstall ${PKG_INFO.name}@${detected.version} from ${detected.pm}?`, {
			...baseResult(detected.pm, PKG_INFO.name, false),
			command: 'uninstall',
			result: 'cancelled' as CommandResultStatus,
			current: detected.version,
			message: 'Cancelled by user'
		})

		const result = await execOrDryRunRemove(detected.pm, PKG_INFO.name, dryRun)

		if (jsonMode) {
			logger.json({
				...baseResult(detected.pm, PKG_INFO.name, dryRun),
				command: 'uninstall',
				result: (dryRun ? 'cancelled' : 'success') as CommandResultStatus,
				current: detected.version,
				cmdStr: result.cmdStr,
				message: dryRun
					? `[dry-run] Would uninstall ${PKG_INFO.name}@${detected.version}`
					: `Uninstalled ${PKG_INFO.name}@${detected.version}`
			})
		} else {
			printSuccess(`Uninstall ${PKG_INFO.name}@${detected.version}`, dryRun)
		}
	}
})

export default uninstallCommand
