import { Agent } from 'package-manager-detector'

import { addCommand, CommandSpec } from '@/core/runner/pm-commands'

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
