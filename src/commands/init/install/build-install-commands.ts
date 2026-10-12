import { Agent } from 'package-manager-detector'

import { addCommand, CommandSpec } from '@/core/runner/pm-commands'

export const buildInstallCommands = (pm: Agent, devSpecs: string[]): CommandSpec[] =>
	devSpecs.length > 0 ? [addCommand(pm, devSpecs, { dev: true })] : []
