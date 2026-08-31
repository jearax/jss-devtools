import { resolveCommand, AgentName } from 'package-manager-detector'

export interface CommandSpec {
	command: string
	args: string[]
}

export const fmtCommand = (spec: CommandSpec): string => [spec.command, ...spec.args].join(' ')

// Local binaries (husky, commitlint, lint-staged). package-manager-detector's
// `execute` maps pnpm to `dlx` (remote one-offs), which cannot resolve locally
// installed bins — pnpm needs `exec` here, so the map stays explicit.
const LOCAL_BIN_COMMAND: Record<string, string[]> = {
	npm: ['npx'],
	pnpm: ['pnpm', 'exec'],
	yarn: ['yarn'],
	bun: ['bunx']
}

export const localBinCommand = (pm: AgentName, bin: string, args: string[] = []): CommandSpec => {
	const prefix = LOCAL_BIN_COMMAND[pm] ?? LOCAL_BIN_COMMAND.npm

	return {
		command: prefix[0],
		args: [...prefix.slice(1), bin, ...args]
	}
}

// bun's documented dev flag is `-d`; npm/pnpm/yarn all accept `-D`.
const devFlag = (pm: AgentName): string => (pm === 'bun' ? '-d' : '-D')

export const addSpecsCommand = (pm: AgentName, specs: string[], options?: { dev?: boolean }): CommandSpec => {
	const resolved = resolveCommand(pm, 'add', [...(options?.dev === true ? [devFlag(pm)] : []), ...specs])

	if (resolved === null) {
		// Unreachable for the four supported agents ('add' is a universal verb);
		// kept as a hard stop in case a new agent slips through detection.
		throw new Error(`No add command for ${pm}`)
	}

	return resolved
}

// One-off runners (prettier-package-json). nypm's dlxCommand exists but emits
// `npm exec <pkg>,<args> --` comma-forms that hurt copy-paste readability, so
// the locked design map (plain, pinned-spec friendly) stays.
export const oneOffRunnerCommand = (
	pm: AgentName,
	pkgSpec: string,
	args: string[],
	isYarnBerry: boolean
): CommandSpec => {
	switch (pm) {
		case 'pnpm':
			return {
				command: 'pnpm',
				args: ['dlx', pkgSpec, ...args]
			}
		case 'bun':
			return {
				command: 'bunx',
				args: [pkgSpec, ...args]
			}
		case 'yarn':
			return isYarnBerry
				? {
						command: 'yarn',
						args: ['dlx', pkgSpec, ...args]
					}
				: {
						command: 'npx',
						args: ['--yes', pkgSpec, ...args]
					}
		default:
			return {
				command: 'npx',
				args: ['--yes', pkgSpec, ...args]
			}
	}
}
