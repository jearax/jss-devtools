import { existsSync } from 'node:fs'

import { select } from '@clack/prompts'
import { detectPackageManager } from 'nypm'
import { AgentName } from 'package-manager-detector'
import { join } from 'pathe'

import { readManifest } from '@/commands/init/utils/manifest'
import { detectMonorepo } from '@/core/detector/monorepo-signals'
import { detectProjectPM, ProjectPM } from '@/core/detector/project-pm'
import { isTTY } from '@/utils/prompts'

export type PreflightFailureCode =
	'NO_PACKAGE_JSON' | 'PACKAGE_JSON_INVALID' | 'MONOREPO_UNSUPPORTED' | 'FOREIGN_LINTER' | 'PM_UNDETECTED'

export interface PreflightFailure {
	code: PreflightFailureCode
	message: string
	hint?: string
}

export interface PreflightOk {
	manifest: Record<string, unknown>
	pm: ProjectPM
	hasGit: boolean
}

export type PreflightResult = { ok: true; value: PreflightOk } | { ok: false; failure: PreflightFailure }

const FOREIGN_LINTER_FILES = ['biome.json', 'biome.jsonc', '.oxlintrc.json'] as const

const PM_CHOICES: Array<{ value: AgentName; label: string }> = [
	{
		value: 'npm',
		label: 'npm'
	},
	{
		value: 'pnpm',
		label: 'pnpm'
	},
	{
		value: 'yarn',
		label: 'yarn'
	},
	{
		value: 'bun',
		label: 'bun'
	}
]

const nypmGuess = async (cwd: string): Promise<AgentName | null> => {
	try {
		const detected = await detectPackageManager(cwd)

		if (detected === undefined) {
			return null
		}

		const name: string = detected.name

		return PM_CHOICES.some((choice) => choice.value === name) ? (name as AgentName) : null
	} catch {
		return null
	}
}

const promptForPM = async (): Promise<ProjectPM | null> => {
	const answer = await select({
		message: 'Which package manager does this project use?',
		options: PM_CHOICES
	})

	if (answer === undefined || typeof answer !== 'string') {
		return null
	}

	return {
		pm: answer as AgentName,
		source: 'nypm-guess',
		isYarnBerry: answer === 'yarn'
	}
}

export const runPreflight = async (cwd: string): Promise<PreflightResult> => {
	const manifestRead = readManifest(cwd)

	if (manifestRead === 'missing') {
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
		return {
			ok: false,
			failure: {
				code: 'FOREIGN_LINTER',
				message: `Foreign linter config found: ${foreignLinter}.`,
				hint: 'init scaffolds the eslint + prettier stack — migrate off the other linter first.'
			}
		}
	}

	let pm = await detectProjectPM(cwd, () => nypmGuess(cwd))

	if (pm === null) {
		if (isTTY()) {
			pm = await promptForPM()
		}

		if (pm === null) {
			return {
				ok: false,
				failure: {
					code: 'PM_UNDETECTED',
					message: 'Could not detect the project package manager.',
					hint: 'Add a packageManager field or a lockfile to package.json, then re-run init.'
				}
			}
		}
	}

	return {
		ok: true,
		value: {
			manifest: manifestRead.manifest,
			pm,
			hasGit: existsSync(join(cwd, '.git'))
		}
	}
}
