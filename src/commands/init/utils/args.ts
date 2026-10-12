import { DEFAULT_FRAMEWORK, InitArgs, InitFeatures, PLANNED_FRAMEWORKS } from '@/commands/init/types'

export type InitArgsErrorCode = 'FRAMEWORK_INVALID' | 'FRAMEWORK_NOT_SUPPORTED'

export class InitArgsError extends Error {
	constructor(
		readonly code: InitArgsErrorCode,
		message: string
	) {
		super(message)
	}
}

// `--no-linter` / `--no-commitlint` / `--no-install` are scanned off raw
// argv rather than declared in citty — keeps them hidden from --help while
// still letting users opt out of any always-on stage. Stops at `--` so any
// `--no-install`-shaped token appearing as a positional after the separator
// is not interpreted as a flag.
export const parseNoFlags = (argv: readonly string[]): InitFeatures => {
	const features: InitFeatures = {
		linter: true,
		commitlint: true,
		install: true
	}

	for (const arg of argv) {
		if (arg === '--') {
			break
		}

		if (arg === '--no-linter') {
			features.linter = false
		} else if (arg === '--no-commitlint') {
			features.commitlint = false
		} else if (arg === '--no-install') {
			features.install = false
		}
	}

	return features
}

export const extractInitArgs = (raw: Record<string, unknown>, argv: readonly string[]): InitArgs => {
	const framework = raw.framework ?? DEFAULT_FRAMEWORK

	if (framework !== DEFAULT_FRAMEWORK) {
		if ((PLANNED_FRAMEWORKS as readonly unknown[]).includes(framework)) {
			throw new InitArgsError(
				'FRAMEWORK_NOT_SUPPORTED',
				`Framework "${String(framework)}" is planned but not supported yet. Use --framework ${DEFAULT_FRAMEWORK}.`
			)
		}

		throw new InitArgsError(
			'FRAMEWORK_INVALID',
			`Unknown framework "${String(framework)}". Valid values: ${[DEFAULT_FRAMEWORK, ...PLANNED_FRAMEWORKS].join(' | ')}.`
		)
	}

	return {
		framework: DEFAULT_FRAMEWORK,
		yes: raw.yes === true,
		dryRun: raw['dry-run'] === true,
		json: raw.json === true,
		features: parseNoFlags(argv)
	}
}
