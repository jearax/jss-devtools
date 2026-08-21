import { defineCommand } from 'citty'

import { extractSelfArgs } from '@/commands/self/utils/args'
import { runUpgradeFlow } from '@/commands/self/utils/update-shared'

const upgradeCommand = defineCommand({
	meta: {
		name: 'upgrade',
		description: 'Upgrade CLI to latest or specified version'
	},
	args: {
		specVer: {
			type: 'positional',
			description: 'Version spec (tag, exact, or semver range)',
			required: false
		},
		yes: {
			type: 'boolean',
			description: 'Skip confirmation prompt',
			default: false
		},
		'dry-run': {
			type: 'boolean',
			description: 'Print command without executing',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'Output structured JSON',
			default: false
		}
	},
	run: async ({ args }) => {
		await runUpgradeFlow(extractSelfArgs(args), 'upgrade')
	}
})

export default upgradeCommand
