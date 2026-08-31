import { AgentName } from 'package-manager-detector'

import { addSpecsCommand, CommandSpec } from '@/core/runner/pm-commands'

// One invocation per dependency class; empty lists produce no command.
export const buildInstallCommands = (pm: AgentName, devSpecs: string[], specs: string[]): CommandSpec[] => {
	const commands: CommandSpec[] = []

	if (devSpecs.length > 0) {
		commands.push(addSpecsCommand(pm, devSpecs, { dev: true }))
	}

	if (specs.length > 0) {
		commands.push(addSpecsCommand(pm, specs))
	}

	return commands
}
