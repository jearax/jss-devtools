import { resolveCommand } from 'package-manager-detector'

import { detectGlobalPM } from '@/core/detector/global-pm'
import { PM_DISPLAY_NAMES } from '@/core/detector/pm'
import { DetectedPM } from '@/core/detector/types'
import { getPmLedger } from '@/core/store/store'
import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'

interface PromptOptions {
	json?: boolean
	yes?: boolean
}

// Recovery hint for PM_NOT_DETECTED: prefer the package manager the user
// installed with most recently (ledger lastPm — NOT pmsSeen order, which is
// first-seen), falling back to npm (CLI runs on node → npm near-universal).
// lastPm is untrusted (hand-edited or corrupted store): resolveCommand throws
// on unknown agents, so validate before use — bad data degrades to npm.
const installHint = (): string => {
	const last = getPmLedger().lastPm
	const pm = last !== null && last in PM_DISPLAY_NAMES ? last : 'npm'

	const resolved = resolveCommand(pm, 'global', [PKG_INFO.name]) ??
		resolveCommand('npm', 'global', [PKG_INFO.name]) ?? {
			command: 'npm',
			args: ['install', '-g', PKG_INFO.name]
		}

	return `Install with: ${resolved.command} ${resolved.args.join(' ')}`
}

export const requireGlobalPM = async (options: PromptOptions): Promise<DetectedPM | null> => {
	const detected = await detectGlobalPM(PKG_INFO.name)

	if (detected) {
		return detected
	}

	const msg = `${PKG_INFO.name} not installed via any known package manager.`
	const hint = installHint()

	if (options.json) {
		logger.json({
			schemaVersion: '1.0',
			result: 'error',
			error: {
				code: 'PM_NOT_DETECTED',
				message: msg,
				hint
			}
		})
	} else {
		logger.error(`${msg}\n${hint}`)
	}

	process.exitCode = 1

	return null
}
