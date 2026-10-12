import { Agent } from 'package-manager-detector'

import { buildInstallCommands } from '@/commands/init/install/build-install-commands'
import { InitPlan } from '@/commands/init/plan/types'
import { fmtCommand, localBinCommand } from '@/core/runner/pm-commands'

// Human-facing plan lines — shared by --dry-run output and the confirm
// summary so the user always previews the exact same execution list.
export const planDisplayLines = (plan: InitPlan, pm: Agent): string[] => {
	const lines: string[] = []

	for (const action of plan.actions) {
		switch (action.kind) {
			case 'git-init':
				lines.push('git init -b main (silent)')
				break
			case 'write-file':
				lines.push(`write ${action.path}`)
				break
			case 'remove-file':
				lines.push(`remove ${action.path} (legacy config)`)
				break

			case 'manifest-edit': {
				const parts = [`package.json: scripts [${Object.keys(action.scripts).join(', ')}]`]

				if (action.lintStaged !== undefined) {
					parts.push('lint-staged config')
				}

				if (action.devDeps !== undefined) {
					parts.push(`${Object.keys(action.devDeps).length} devDependencies`)
				}

				lines.push(parts.join(', '))

				break
			}

			case 'install': {
				for (const command of buildInstallCommands(pm, action.devSpecs)) {
					lines.push(fmtCommand(command))
				}

				break
			}

			case 'husky-activate':
				lines.push(fmtCommand(localBinCommand(pm, 'husky')))
				break
		}
	}

	for (const conflict of plan.pendingConflicts) {
		lines.push(`conflict: ${conflict.target} ← ${conflict.existing.join(', ')}`)
	}

	return lines
}
