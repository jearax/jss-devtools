// `jss-devtools update` — full alias of upgrade (incl. spec positional), plus
// the legacy `check` version list. citty subCommands cannot coexist with a
// positional spec (they claim the first positional and reject unknown names
// with a raw usage dump), and citty runs the parent run() after a subcommand
// (double execution) — so dispatch manually on the positional instead.
import { defineCommand } from 'citty'

import { extractSelfArgs } from '@/commands/self/utils/args'
import { runUpgradeFlow } from '@/commands/self/utils/update-shared'

const updateCommand = defineCommand({
	meta: {
		name: 'update',
		description: 'Update CLI (alias of upgrade) or check available versions'
	},
	args: {
		specVer: {
			type: 'positional',
			description: 'Version spec (tag, exact, or semver range), or "check" to list versions',
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
		if (args.specVer === 'check') {
			const check = await import('./update-check.js')

			await check.default.run?.({
				args: { json: args.json === true },
				rawArgs: []
			} as never)

			return
		}

		await runUpgradeFlow(extractSelfArgs(args), 'update')
	}
})

export default updateCommand
