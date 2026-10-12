import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { Agent } from 'package-manager-detector'

import { readManifest } from '@/commands/init/utils/manifest'
import { detectMonorepo } from '@/core/detector/monorepo-signals'
import { detectProjectAgent } from '@/core/detector/project-pm'
import { startSpinner } from '@/utils/progress'

export type PreflightFailureCode =
	'NO_PACKAGE_JSON' | 'PACKAGE_JSON_INVALID' | 'MONOREPO_UNSUPPORTED' | 'FOREIGN_LINTER'

export interface PreflightFailure {
	code: PreflightFailureCode
	message: string
	hint?: string
}

export interface PreflightOk {
	manifest: Record<string, unknown>
	pm: Agent
	hasGit: boolean
}

export type PreflightResult = { ok: true; value: PreflightOk } | { ok: false; failure: PreflightFailure }

const FOREIGN_LINTER_FILES = ['biome.json', 'biome.jsonc', '.oxlintrc.json'] as const

// No lockfile and no packageManager field: npm is what Node ships with.
const DEFAULT_AGENT: Agent = 'npm'

export const runPreflight = async (cwd: string, opts: { silent?: boolean } = {}): Promise<PreflightResult> => {
	const sp = startSpinner('Checking project', { silent: opts.silent })
	let finalized = false

	const finalizeFail = (): void => {
		if (!finalized) {
			sp.fail()
			finalized = true
		}
	}

	const finalizeDone = (text: string): void => {
		sp.done(text)
		finalized = true
	}

	try {
		const manifestRead = readManifest(cwd)

		if (manifestRead === 'missing') {
			finalizeFail()

			return {
				ok: false,
				failure: {
					code: 'NO_PACKAGE_JSON',
					message: `No package.json found in ${cwd}.`,
					hint: 'jss-devtools init bootstraps an existing JS/TS project — create one first.'
				}
			}
		}

		if (manifestRead === 'invalid') {
			finalizeFail()

			return {
				ok: false,
				failure: {
					code: 'PACKAGE_JSON_INVALID',
					message: 'package.json is not valid JSON.',
					hint: 'Fix the parse error, then re-run init (completed parts are skipped).'
				}
			}
		}

		const monorepo = detectMonorepo(cwd, manifestRead.manifest)

		if (monorepo !== null) {
			finalizeFail()

			return {
				ok: false,
				failure: {
					code: 'MONOREPO_UNSUPPORTED',
					message: `Monorepo detected (${monorepo.evidence}).`,
					hint: 'init operates on a single package — run it inside a workspace package.'
				}
			}
		}

		const foreignLinter = FOREIGN_LINTER_FILES.find((file) => existsSync(join(cwd, file)))

		if (foreignLinter !== undefined) {
			finalizeFail()

			return {
				ok: false,
				failure: {
					code: 'FOREIGN_LINTER',
					message: `Foreign linter config found: ${foreignLinter}.`,
					hint: 'init scaffolds the eslint + prettier stack — migrate off the other linter first.'
				}
			}
		}

		const pm = (await detectProjectAgent(cwd)) ?? DEFAULT_AGENT

		finalizeDone('Project check passed')

		return {
			ok: true,
			value: {
				manifest: manifestRead.manifest,
				pm,
				hasGit: existsSync(join(cwd, '.git'))
			}
		}
	} finally {
		if (!finalized) {
			sp.fail()
		}
	}
}
