import { Agent } from 'package-manager-detector'

import { addCommand, CommandSpec } from '@/core/runner/pm-commands'

// One invocation per dependency class; empty lists produce no command.
export const buildInstallCommands = (pm: Agent, devSpecs: string[], specs: string[]): CommandSpec[] => {
	const commands: CommandSpec[] = []

	if (devSpecs.length > 0) {
		commands.push(addCommand(pm, devSpecs, { dev: true }))
	}

	if (specs.length > 0) {
		commands.push(addCommand(pm, specs))
	}

	return commands
}
