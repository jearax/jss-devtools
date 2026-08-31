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

// Default-on features stay on unless the parser delivered an explicit
// negation (false). Checking `!== false` (instead of `=== true`) keeps the
// extractor immune to key-order surprises when citty merges defaults.
const extractFeatures = (raw: Record<string, unknown>): InitFeatures => ({
	linter: raw.linter !== false,
	commitlint: raw.commitlint !== false,
	install: raw.install !== false
})

export const extractInitArgs = (raw: Record<string, unknown>): InitArgs => {
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
		features: extractFeatures(raw)
	}
}
