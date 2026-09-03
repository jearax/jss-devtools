import { FRAMEWORK_IDS, FrameworkId, InitArgs, InitFeatures } from '@/commands/init/types'

export type InitArgsErrorCode = 'FRAMEWORK_REQUIRED' | 'FRAMEWORK_INVALID'

export class InitArgsError extends Error {
	constructor(
		readonly code: InitArgsErrorCode,
		message: string
	) {
		super(message)
	}
}

const isFrameworkId = (value: unknown): value is FrameworkId =>
	typeof value === 'string' && (FRAMEWORK_IDS as readonly string[]).includes(value)

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
	const framework = raw.framework

	if (framework === undefined) {
		throw new InitArgsError(
			'FRAMEWORK_REQUIRED',
			`Missing required flag --framework. Valid values: ${FRAMEWORK_IDS.join(' | ')}.`
		)
	}

	if (!isFrameworkId(framework)) {
		throw new InitArgsError(
			'FRAMEWORK_INVALID',
			`Unknown framework "${String(framework)}". Valid values: ${FRAMEWORK_IDS.join(' | ')}.`
		)
	}

	return {
		framework,
		yes: raw.yes === true,
		dryRun: raw['dry-run'] === true,
		json: raw.json === true,
		features: parseNoFlags(argv)
	}
}
