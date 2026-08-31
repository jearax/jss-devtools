import { existsSync, readFileSync } from 'node:fs'

import { AgentName } from 'package-manager-detector'
import { join } from 'pathe'

export type ProjectPMSource = 'packageManager-field' | 'lockfile' | 'nypm-guess'

export interface ProjectPM {
	pm: AgentName
	source: ProjectPMSource
	/** Yarn berry (>=2) has `dlx`; classic v1 falls back to npx for one-offs. */
	isYarnBerry: boolean
}

const LOCKFILE_TO_PM: Array<[string, AgentName]> = [
	['pnpm-lock.yaml', 'pnpm'],
	['package-lock.json', 'npm'],
	['yarn.lock', 'yarn'],
	['bun.lockb', 'bun'],
	['bun.lock', 'bun']
]

const yarnBerryFromManifest = (packageManagerField: string): boolean => {
	const version = packageManagerField.split('@')[1] ?? ''

	return /^[2-9]/.test(version)
}

const yarnIsBerry = (cwd: string, packageManagerField?: string): boolean => {
	if (packageManagerField?.startsWith('yarn@') === true) {
		return yarnBerryFromManifest(packageManagerField)
	}

	// No pinned version: `.yarnrc.yml` only exists in berry projects (v1 reads
	// `.yarnrc` instead), so its presence is the cheapest reliable signal.
	return existsSync(join(cwd, '.yarnrc.yml'))
}

export const detectProjectPM = async (
	cwd: string,
	fallbackGuess: () => Promise<AgentName | null>
): Promise<ProjectPM | null> => {
	let manifest: Record<string, unknown>

	try {
		manifest = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as Record<string, unknown>
	} catch {
		manifest = {}
	}

	// 1. `packageManager` field — the explicit, tooling-agnostic pin.
	const packageManagerField = typeof manifest.packageManager === 'string' ? manifest.packageManager : undefined

	if (packageManagerField !== undefined) {
		const name = packageManagerField.split('@')[0]

		if (name === 'npm' || name === 'pnpm' || name === 'yarn' || name === 'bun') {
			return {
				pm: name,
				source: 'packageManager-field',
				isYarnBerry: yarnIsBerry(cwd, packageManagerField)
			}
		}
	}

	// 2. Lockfile in cwd — what the project was actually installed with.
	for (const [lockfile, pm] of LOCKFILE_TO_PM) {
		if (existsSync(join(cwd, lockfile))) {
			return {
				pm,
				source: 'lockfile',
				isYarnBerry: yarnIsBerry(cwd, packageManagerField)
			}
		}
	}

	// 3. Caller-supplied guess (nypm findup) — last resort before prompting.
	const guessed = await fallbackGuess()

	if (guessed !== null) {
		return {
			pm: guessed,
			source: 'nypm-guess',
			isYarnBerry: yarnIsBerry(cwd, packageManagerField)
		}
	}

	return null
}
