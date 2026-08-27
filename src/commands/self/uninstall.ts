import { defineCommand } from 'citty'

import { extractSelfArgs } from '@/commands/self/utils/args'
import { requireGlobalPM } from '@/commands/self/utils/flow'
import { CommandResultStatus, baseResult, printSuccess } from '@/commands/self/utils/result'
import { detectGlobalPMs } from '@/core/detector/global-pm'
import { PM_DISPLAY_NAMES } from '@/core/detector/pm'
import { DetectedPM } from '@/core/detector/types'
import { execOrDryRunRemove, ExecResult } from '@/core/self-installer/exec'
import { getPmLedger } from '@/core/store/store'
import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'
import { confirmOrCancel } from '@/utils/prompts'

// Execa failures carry a concise `shortMessage` (exit code + command line);
// with captured stdio the buffered `stderr` adds the PM's own error detail.
const failureReason = (err: unknown): string => {
	if (err instanceof Error) {
		const { shortMessage, stderr } = err as Error & { shortMessage?: string; stderr?: string }
		const detail = typeof stderr === 'string' ? stderr.trim() : ''
		const head = typeof shortMessage === 'string' ? shortMessage : err.message

		return detail.length > 0 ? `${head}\n${detail}` : head
	}

	return String(err)
}

// Boundary guard for the PM remove step (core exec stays throw-y): converts
// any failure into structured output + exit code 1 — never throws, never
// surfaces a stack trace. Local to uninstall per phase-03 scope.
const removeOrReport = async (
	detected: DetectedPM,
	options: { dryRun: boolean; jsonMode: boolean; notes: string[] }
): Promise<ExecResult | null> => {
	try {
		return await execOrDryRunRemove(detected.pm, PKG_INFO.name, options.dryRun, {
			capture: options.jsonMode && !options.dryRun
		})
	} catch (err) {
		const message = `Failed to uninstall via package manager: ${failureReason(err)}`

		if (options.jsonMode) {
			logger.json({
				...baseResult(detected.pm, PKG_INFO.name, options.dryRun),
				command: 'uninstall',
				result: 'error' as CommandResultStatus,
				current: detected.version,
				notes: options.notes,
				error: {
					code: 'PM_EXEC_FAILED',
					message
				}
			})
		} else {
			logger.error(message)
		}

		process.exitCode = 1

		return null
	}
}

const uninstallCommand = defineCommand({
	meta: {
		name: 'uninstall',
		description: 'Uninstall CLI from global'
	},
	args: {
		yes: {
			type: 'boolean',
			description: 'Skip confirmation prompt',
			default: false,
			alias: 'y'
		},
		'dry-run': {
			type: 'boolean',
			description: 'Print command without executing',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'Output structured JSON',
			default: false
		}
	},
	run: async ({ args }) => {
		const { dryRun, json: jsonMode, yes } = extractSelfArgs(args)

		const promptOptions = {
			json: jsonMode,
			yes,
			destructive: true
		}

		const detected = await requireGlobalPM(promptOptions)

		if (!detected) {
			return
		}

		// Shadowing awareness: every current global install + PMs from the ledger
		// the user has installed with before (possible leftover copies).
		const allMatches = await detectGlobalPMs(PKG_INFO.name)
		const ledger = getPmLedger()
		const shadowed = allMatches.filter((m) => m.pm !== detected.pm)
		const previousPms = ledger.pmsSeen.filter((pm) => pm !== detected.pm)
		const notes: string[] = []

		if (shadowed.length > 0) {
			notes.push(
				`Multiple global installs detected: ${allMatches
					.map((m) => `${PM_DISPLAY_NAMES[m.pm]}@${m.version}`)
					.join(', ')} — this removes only the ${PM_DISPLAY_NAMES[detected.pm]} copy.`
			)
		}

		if (previousPms.length > 0) {
			notes.push(
				`Previously installed via ${previousPms.map((pm) => PM_DISPLAY_NAMES[pm]).join(', ')} — leftover copies possible.`
			)
		}

		// Notes print standalone (not inside the prompt) so they surface in
		// human mode even when --yes skips confirmation.
		if (notes.length > 0 && !jsonMode) {
			logger.warn(notes.join('\n'))
		}

		const confirmed = await confirmOrCancel(
			promptOptions,
			`Uninstall ${PKG_INFO.name}@${detected.version} from ${PM_DISPLAY_NAMES[detected.pm]}?`,
			{
				...baseResult(detected.pm, PKG_INFO.name, dryRun),
				command: 'uninstall',
				result: 'cancelled' as CommandResultStatus,
				current: detected.version,
				notes,
				message: 'Cancelled by user'
			}
		)

		if (!confirmed) {
			return
		}

		const result = await removeOrReport(detected, {
			dryRun,
			jsonMode,
			notes
		})

		if (!result) {
			return
		}

		if (jsonMode) {
			logger.json({
				...baseResult(detected.pm, PKG_INFO.name, dryRun),
				command: 'uninstall',
				result: (dryRun ? 'dry-run' : 'success') as CommandResultStatus,
				current: detected.version,
				notes,
				cmdStr: result.cmdStr,
				message: dryRun
					? `[dry-run] Would uninstall ${PKG_INFO.name}@${detected.version}`
					: `Uninstalled ${PKG_INFO.name}@${detected.version}`
			})
		} else {
			printSuccess(`Uninstall ${PKG_INFO.name}@${detected.version}`, dryRun)
		}
	}
})

export default uninstallCommand
