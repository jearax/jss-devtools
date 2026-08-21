// Detect which package manager(s) installed the CLI globally.
// Strategy: probe all known PMs in parallel, rank matches by PROBE_ORDER
// (pnpm > npm > yarn classic > bun). Collecting every match lets callers warn
// about shadowed installs (same package via multiple PMs).
// Result cached per-process to avoid repeated subprocess calls.
import { execa } from 'execa'
import { AgentName } from 'package-manager-detector'

import { PM_DISPLAY_NAMES, PROBE_ORDER } from '@/core/detector/pm'
import { DetectedPM } from '@/core/detector/types'
import { recordPmSeen } from '@/core/store'
import { logger } from '@/utils/logger'

// Per-PM list-global command (no equivalent in package-manager-detector).
const LIST_GLOBAL_COMMANDS: Partial<Record<AgentName, string[]>> = {
	npm: ['ls', '-g', '--depth=0', '--json'],
	pnpm: ['list', '-g', '--depth=0', '--json'],
	yarn: ['global', 'list', '--json'],
	bun: ['pm', 'ls', '-g']
}

let cachedMatches: DetectedPM[] | null = null

const parseVersionFromList = (pm: AgentName, stdout: string, pkg: string): string | null => {
	try {
		if (pm === 'npm') {
			const parsed: { dependencies?: Record<string, unknown> } = JSON.parse(stdout)
			const deps = parsed.dependencies ?? {}
			const key = Object.keys(deps).find((k) => k.startsWith(`${pkg}@`))

			return key ? key.slice(`${pkg}@`.length) : null
		}

		if (pm === 'pnpm') {
			const arr: { name?: string; version?: string }[] = JSON.parse(stdout)
			const found = Array.isArray(arr) ? arr.find((p) => p.name === pkg) : null

			return found?.version ?? null
		}

		if (pm === 'yarn') {
			const parsed: { data?: unknown[] } = JSON.parse(stdout)
			const data = Array.isArray(parsed.data) ? parsed.data : []

			const found = data.find((row: unknown) => {
				if (!Array.isArray(row)) {
					return false
				}

				const name = row[0]

				if (typeof name !== 'string') {
					return false
				}

				return name === pkg || name.startsWith(`${pkg}@`)
			})

			if (!Array.isArray(found) || typeof found[0] !== 'string') {
				return null
			}

			return found[0].slice(`${pkg}@`.length)
		}

		// bun: parse name@version strings
		const line = stdout.split('\n').find((l) => l.includes(`${pkg}@`))

		if (!line) {
			return null
		}

		const match = line.match(new RegExp(`${pkg}@(\\d+\\.\\d+\\.\\d+.*?)`))

		return match?.[1] ?? null
	} catch {
		return null
	}
}

const probeOne = async (pm: AgentName, pkg: string): Promise<DetectedPM | null> => {
	const args = LIST_GLOBAL_COMMANDS[pm]

	if (!args) {
		return null
	}

	try {
		const { stdout, exitCode } = await execa(pm, args, { reject: false })

		if (exitCode !== 0) {
			return null
		}

		const version = parseVersionFromList(pm, stdout, pkg)

		return version
			? {
					pm,
					version
				}
			: null
	} catch {
		// PM not installed or other error — no match from this probe
		return null
	}
}

/**
 * All global installs of `pkg`, ranked by PROBE_ORDER (index 0 = winner).
 * Empty array means the package is not globally installed via any known PM.
 */
export const detectGlobalPMs = async (pkg: string): Promise<DetectedPM[]> => {
	if (cachedMatches !== null) {
		return cachedMatches
	}

	const results = await Promise.all(PROBE_ORDER.map((pm) => probeOne(pm, pkg)))
	const matches = results.filter((m): m is DetectedPM => m !== null)

	cachedMatches = matches

	if (matches.length > 0) {
		logger.debug(`Detected global installs: ${matches.map((m) => `${PM_DISPLAY_NAMES[m.pm]}@${m.version}`).join(', ')}`)

		// Fire-and-forget ledger write — detection never depends on persistence.
		try {
			recordPmSeen(matches[0].pm)
		} catch {
			// stateless mode or write failure — ignore
		}
	}

	return matches
}

/** Winner-only convenience wrapper (first match by probe priority). */
export const detectGlobalPM = async (pkg: string): Promise<DetectedPM | null> => {
	const matches = await detectGlobalPMs(pkg)

	return matches[0] ?? null
}
