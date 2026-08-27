import { execa } from 'execa'
import { AgentName } from 'package-manager-detector'

import { PM_DISPLAY_NAMES, PROBE_ORDER } from '@/core/detector/pm'
import { DetectedPM } from '@/core/detector/types'
import { recordPmSeen } from '@/core/store/store'
import { logger } from '@/utils/logger'

// Per-PM list-global command (no equivalent in package-manager-detector).
const LIST_GLOBAL_COMMANDS: Partial<Record<AgentName, string[]>> = {
	npm: ['ls', '-g', '--depth=0', '--json'],
	pnpm: ['list', '-g', '--depth=0', '--json'],
	yarn: ['global', 'list', '--json'],
	bun: ['pm', 'ls', '-g']
}

const parseVersionFromList = (pm: AgentName, stdout: string, pkg: string): string | null => {
	try {
		switch (pm) {
			// npm nests deps as keys "pkg@version" (npm ≤ 10); npm 11+ keys
			// plain "pkg" names with the version nested as { version, ... }
			case 'npm': {
				const parsed: { dependencies?: Record<string, unknown> } = JSON.parse(stdout)
				const deps = parsed.dependencies ?? {}
				const legacy = Object.keys(deps).find((k) => k.startsWith(`${pkg}@`))

				if (legacy) {
					return legacy.slice(`${pkg}@`.length)
				}

				const entry = deps[pkg] as { version?: unknown } | undefined

				return typeof entry?.version === 'string' ? entry.version : null
			}

			// pnpm emits a top-level array of { name, version }
			case 'pnpm': {
				const arr: { name?: string; version?: string }[] = JSON.parse(stdout)
				const found = Array.isArray(arr) ? arr.find((p) => p.name === pkg) : null

				return found?.version ?? null
			}

			// yarn classic emits NDJSON events; global packages surface as
			// {"type":"info","data":"\"pkg@version\" has binaries:"} lines
			// (v1 only lists bin-having packages — fine for a CLI detector)
			case 'yarn': {
				const event = stdout
					.split('\n')
					.map((line) => {
						try {
							return JSON.parse(line) as { type?: unknown; data?: unknown }
						} catch {
							return null
						}
					})
					.find((e) => e?.type === 'info' && typeof e.data === 'string' && e.data.startsWith(`"${pkg}@`))

				if (!event || typeof event.data !== 'string') {
					return null
				}

				const match = event.data.match(new RegExp(`${pkg}@(\\d+\\.\\d+\\.\\d+.*?)"`))

				return match?.[1] ?? null
			}

			// bun (and any future PM): plain "pkg@version" lines
			default: {
				const line = stdout.split('\n').find((l) => l.includes(`${pkg}@`))

				if (!line) {
					return null
				}

				const match = line.match(new RegExp(`${pkg}@(\\d+\\.\\d+\\.\\d+.*?)`))

				return match?.[1] ?? null
			}
		}
	} catch {
		return null
	}
}

// A wedged package manager (network stall, lock wait) must never wedge the
// CLI: probes time out and count as "no install via this PM".
const PROBE_TIMEOUT_MS = 10_000

const probeOne = async (pm: AgentName, pkg: string): Promise<DetectedPM | null> => {
	const args = LIST_GLOBAL_COMMANDS[pm]

	if (!args) {
		return null
	}

	try {
		const { stdout, exitCode } = await execa(pm, args, {
			reject: false,
			timeout: PROBE_TIMEOUT_MS
		})

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
		return null
	}
}

// Per-process memo: null = not probed yet, [] = probed but no install (negative cache).
let cachedMatches: DetectedPM[] | null = null

/** All current global installs of `pkg`, ranked by PROBE_ORDER (index 0 = winner). */
export const detectGlobalPMs = async (pkg: string): Promise<DetectedPM[]> => {
	if (cachedMatches !== null) {
		return cachedMatches
	}

	const results = await Promise.all(PROBE_ORDER.map((pm) => probeOne(pm, pkg)))
	const matches = results.filter((m): m is DetectedPM => m !== null)

	cachedMatches = matches

	if (matches.length > 0) {
		logger.debug(`Detected global installs: ${matches.map((m) => `${PM_DISPLAY_NAMES[m.pm]}@${m.version}`).join(', ')}`)

		// Fire-and-forget: detection must never fail because the ledger write failed.
		try {
			recordPmSeen(matches[0].pm)
		} catch {
			// stateless mode or write failure — ignore
		}
	}

	return matches
}

export const detectGlobalPM = async (pkg: string): Promise<DetectedPM | null> => {
	const matches = await detectGlobalPMs(pkg)

	return matches[0] ?? null
}
