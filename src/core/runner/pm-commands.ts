import { Agent, Command, resolveCommand } from 'package-manager-detector'

export interface CommandSpec {
	command: string
	args: string[]
}

export const fmtCommand = (spec: CommandSpec): string => [spec.command, ...spec.args].join(' ')

const resolve = (agent: Agent, command: Command, args: string[]): CommandSpec => {
	const resolved = resolveCommand(agent, command, args)

	if (resolved === null) {
		throw new Error(`No "${command}" command for ${agent}`)
	}

	return resolved
}

// `-D` is accepted by npm, pnpm, yarn and bun alike.
export const addCommand = (agent: Agent, specs: string[], options?: { dev?: boolean }): CommandSpec =>
	resolve(agent, 'add', [...(options?.dev === true ? ['-D'] : []), ...specs])

// Locally installed bins (husky, lint-staged, commitlint).
export const localBinCommand = (agent: Agent, bin: string, args: string[] = []): CommandSpec =>
	resolve(agent, 'execute-local', [bin, ...args])
