import { readFileSync } from 'node:fs'

import { join } from 'pathe'

import { resolveSpecs } from '@/commands/init/install/resolve-specs'
import { computePlan } from '@/commands/init/plan/compute-plan'
import { planDisplayLines } from '@/commands/init/plan/display'
import { InitPlan } from '@/commands/init/plan/types'
import { getPreset } from '@/commands/init/presets/get-preset'
import { InitArgs, InitResult } from '@/commands/init/types'
import { applyPlan } from '@/commands/init/utils/apply-plan'
import { confirmPlan, logRequiresConfirmation } from '@/commands/init/utils/confirm-plan'
import { runPreflight } from '@/commands/init/utils/preflight'
import { logger } from '@/utils/logger'

const readerFor =
	(cwd: string) =>
	(path: string): string | null => {
		try {
			return readFileSync(join(cwd, path), 'utf8')
		} catch {
			return null
		}
	}

const errorResult = (args: InitArgs, message: string): InitResult => ({
	schemaVersion: '1.0',
	command: 'init',
	status: 'error',
	framework: args.framework,
	pm: null,
	generated: [],
	modified: [],
	installed: [],
	skipped: [],
	conflicts: [],
	dryRun: args.dryRun,
	message
})

const abort = (args: InitArgs, code: string, message: string, hint?: string): InitResult => {
	if (args.json) {
		logger.json({
			schemaVersion: '1.0',
			command: 'init',
			result: 'error',
			error: {
				code,
				message,
				...(hint !== undefined ? { hint } : {})
			}
		})
	} else {
		logger.error(hint === undefined ? `${code}: ${message}` : `${code}: ${message}\n${hint}`)
	}

	process.exitCode = 1

	return errorResult(args, message)
}

// Keep resolution: drop writes for kept targets; the tied preset-specific
// eslint plugins ride along (core linter deps stay — format still runs).
const dropKeptTargets = (plan: InitPlan, keptTargets: string[]): InitPlan => {
	const actions = plan.actions.filter((action) => !(action.kind === 'write-file' && keptTargets.includes(action.path)))

	const skipped = [
		...plan.skipped,
		...keptTargets.map((target) => ({
			feature: 'linter' as const,
			reason: `kept existing ${target}`
		}))
	]

	return {
		...plan,
		actions,
		skipped
	}
}

export const runInitFlow = async (args: InitArgs): Promise<InitResult> => {
	const startedAt = Date.now()
	const cwd = process.cwd()
	const silent = args.json === true

	const preflight = await runPreflight(cwd, { silent })

	if (!preflight.ok) {
		return abort(args, preflight.failure.code, preflight.failure.message, preflight.failure.hint)
	}

	const { manifest, pm, hasGit } = preflight.value
	const preset = getPreset(args.framework)
	const specs = await resolveSpecs(preset, args.features, manifest, { silent })

	if (specs.offlineFallback) {
		logger.warn('Registry unreachable — some specs fell back to @latest.')
	}

	const plan = computePlan(args, {
		pm: pm.pm,
		isYarnBerry: pm.isYarnBerry,
		manifest,
		hasGit,
		specs,
		readFile: readerFor(cwd)
	})

	const displayLines = planDisplayLines(plan, pm.pm)
	const decision = await confirmPlan(args, plan, displayLines)

	if (decision.kind === 'requires-confirmation') {
		logRequiresConfirmation()

		return abort(args, 'REQUIRES_CONFIRMATION', 'Conflicting configs need an explicit choice.')
	}

	if (decision.kind === 'cancelled') {
		const cancelled: InitResult = {
			schemaVersion: '1.0',
			command: 'init',
			status: 'cancelled',
			framework: args.framework,
			pm: pm.pm,
			generated: [],
			modified: [],
			installed: [],
			skipped: plan.skipped,
			conflicts: [],
			dryRun: false,
			message: 'Cancelled by user'
		}

		if (args.json) {
			logger.json(cancelled)
		} else {
			logger.info('Cancelled jss-devtools init.')
		}

		return cancelled
	}

	const effectivePlan =
		decision.kind === 'proceed-keeping' ? dropKeptTargets(plan, decision.keptTargets) : withLegacyRemovals(plan)

	if (args.dryRun) {
		for (const line of planDisplayLines(effectivePlan, pm.pm)) {
			logger.info(`[dry-run] ${line}`)
		}

		const dryResult: InitResult = {
			schemaVersion: '1.0',
			command: 'init',
			status: 'dry-run',
			framework: args.framework,
			pm: pm.pm,
			generated: effectivePlan.actions
				.filter((action) => action.kind === 'write-file')
				.map((action) => (action.kind === 'write-file' ? action.path : '')),
			modified: ['package.json'],
			installed: [],
			skipped: effectivePlan.skipped,
			conflicts: [],
			dryRun: true,
			message: 'Dry run — nothing written',
			durationMs: Date.now() - startedAt
		}

		if (args.json) {
			logger.json(dryResult)
		}

		return dryResult
	}

	const outcome = await applyPlan(effectivePlan, {
		cwd,
		pm: pm.pm,
		capture: args.json,
		silent,
		isWindows: process.platform === 'win32'
	})

	const status: InitResult['status'] =
		outcome.installOk === false ? 'error' : outcome.mutations === 0 ? 'noop' : 'success'

	const result: InitResult = {
		schemaVersion: '1.0',
		command: 'init',
		status,
		framework: args.framework,
		pm: pm.pm,
		generated: outcome.generated,
		modified: outcome.modified,
		installed: outcome.installed,
		skipped: outcome.skipped,
		conflicts: outcome.conflicts,
		dryRun: false,
		message:
			status === 'error'
				? 'Install failed — configs are on disk; fix the error and re-run (done parts no-op).'
				: status === 'noop'
					? 'Everything already up to date.'
					: `Initialized ${args.framework} tooling.`,
		durationMs: Date.now() - startedAt
	}

	if (status === 'error') {
		process.exitCode = 1
	}

	if (args.json) {
		logger.json(result)
	} else {
		logSummary(result, outcome.removed)
	}

	return result
}

// Replace resolution: legacy variants are removed so two configs never fight
// over one concern (jss-cli removeConfigFiles pattern).
const withLegacyRemovals = (plan: InitPlan): InitPlan => {
	const removals = plan.pendingConflicts.flatMap((conflict) =>
		conflict.existing
			.filter((path) => path !== conflict.target)
			.map((path) => ({
				kind: 'remove-file' as const,
				path
			}))
	)

	return removals.length === 0
		? plan
		: {
				...plan,
				actions: [...plan.actions, ...removals]
			}
}

const logSummary = (result: InitResult, removed: string[]): void => {
	if (result.status === 'noop') {
		logger.success(result.message)

		return
	}

	logger.success(result.message)

	for (const path of result.generated) {
		logger.log(`  + ${path}`)
	}

	for (const path of result.modified) {
		logger.log(`  ~ ${path}`)
	}

	for (const path of removed) {
		logger.log(`  - ${path}`)
	}

	if (result.installed.length > 0) {
		logger.log(`  ⧉ ${result.installed.length} packages installed`)
	}

	for (const entry of result.skipped) {
		logger.log(`  ! ${entry.feature}: ${entry.reason}`)
	}
}
