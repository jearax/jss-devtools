import { defineCommand } from 'citty'

import { runInitFlow } from '@/commands/init/run-init-flow'
import { extractInitArgs, InitArgsError } from '@/commands/init/utils/args'
import { logger } from '@/utils/logger'

// Framework is validated by extractInitArgs (not citty's required check) so
// the FRAMEWORK_REQUIRED/INVALID contract and message stay under our control.
const initCommand = defineCommand({
	meta: {
		name: 'init',
		description: 'Initialize dev tooling on an existing project'
	},
	args: {
		framework: {
			type: 'string',
			description: 'Target framework: node | react | next (required)',
			required: false
		},
		yes: {
			type: 'boolean',
			description: 'Skip prompts, accept defaults',
			default: false
		},
		'dry-run': {
			type: 'boolean',
			description: 'Print the plan without writing or installing',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'Output structured JSON result',
			default: false
		}
		// `--no-linter` / `--no-commitlint` / `--no-install` are intentionally
		// hidden from --help. Defaults are on; argv scan in extractInitArgs
		// catches the negation flag without exposing a positive form to citty.
	},
	run: async ({ args }) => {
		try {
			await runInitFlow(extractInitArgs(args as Record<string, unknown>, process.argv.slice(2)))
		} catch (error) {
			if (error instanceof InitArgsError) {
				const message = `${error.code}: ${error.message}`

				if (args.json === true) {
					logger.json({
						schemaVersion: '1.0',
						command: 'init',
						result: 'error',
						error: {
							code: error.code,
							message: error.message
						}
					})
				} else {
					logger.error(message)
				}

				process.exitCode = 1

				return
			}

			throw error
		}
	}
})

export default initCommand
