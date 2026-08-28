// Shared upgrade flow: detect → fetch → resolve → confirm → exec (used by update + upgrade).
import { resolveCommand } from 'package-manager-detector'

import { requireGlobalPM } from '@/commands/self/utils/flow'
import { CommandResultStatus, baseResult, printSuccess } from '@/commands/self/utils/result'
import { PM_DISPLAY_NAMES } from '@/core/detector/pm'
import { DetectedPM } from '@/core/detector/types'
import { fetchPackageMetadata } from '@/core/registry-client/fetch-package'
import { PackageMetadata } from '@/core/registry-client/types'
import { execOrDryRunInstall, ExecResult } from '@/core/self-installer/exec'
import { parseSpec, resolveTarget, ParsedSpec, ResolveResult } from '@/core/version-resolver/resolve-target'
import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'
import { confirmOrCancel } from '@/utils/prompts'

const PKG = PKG_INFO.name

export interface UpgradeOptions {
	specVer?: string
	yes?: boolean
	dryRun?: boolean
	json?: boolean
}

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

// Context every boundary guard needs for a rich-form error payload.
interface FlowContext {
	command: 'update' | 'upgrade'
	pm: DetectedPM['pm']
	spec: string | null
	current: string
	jsonMode: boolean
	dryRun: boolean
}

// Boundary guard for the registry fetch step (core fetch stays throw-y):
// converts a thrown fetch failure into structured output + exit code 1.
const fetchOrReport = async (ctx: FlowContext): Promise<PackageMetadata | null> => {
	try {
		return await fetchPackageMetadata(PKG)
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)

		if (ctx.jsonMode) {
			logger.json({
				...baseResult(ctx.pm, PKG, ctx.dryRun),
				command: ctx.command,
				result: 'error' as CommandResultStatus,
				spec: ctx.spec,
				current: ctx.current,
				error: {
					code: 'REGISTRY_FETCH_FAILED',
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

// Boundary guard for the PM install step (core exec stays throw-y): converts
// any failure into structured output + exit code 1 — never throws, never
// surfaces a stack trace. Json mode also captures child stdio so the JSON
// document stays alone on stdout (human mode keeps live PM output).
const installOrReport = async (
	ctx: FlowContext,
	target: string,
	majorBump: boolean,
	dryRun: boolean
): Promise<ExecResult | null> => {
	try {
		return await execOrDryRunInstall(ctx.pm, PKG, target, dryRun, {
			capture: ctx.jsonMode && !dryRun
		})
	} catch (err) {
		const message = `Failed to ${ctx.command} via package manager: ${failureReason(err)}`

		if (ctx.jsonMode) {
			logger.json({
				...baseResult(ctx.pm, PKG, dryRun),
				command: ctx.command,
				result: 'error' as CommandResultStatus,
				spec: ctx.spec,
				current: ctx.current,
				target,
				majorBump,
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

// The prompt shows the exact command the exec layer will run — build it from
// resolveCommand (precedent: flow.ts installHint), never a hardcoded template
// (npm runs `npm i -g`, yarn `yarn global add`; only pnpm matches `add -g`).
const willRunOf = (pm: DetectedPM['pm'], target: string): string => {
	const pkgSpec = `${PKG}@${target}`

	const resolved = resolveCommand(pm, 'global', [pkgSpec]) ??
		resolveCommand('npm', 'global', [pkgSpec]) ?? {
			command: 'npm',
			args: ['install', '-g', pkgSpec]
		}

	return `${resolved.command} ${resolved.args.join(' ')}`
}

export const runUpgradeFlow = async (options: UpgradeOptions, command: 'update' | 'upgrade'): Promise<void> => {
	const dryRun = options.dryRun === true
	const jsonMode = options.json === true

	const detected = await requireGlobalPM(options)

	if (!detected) {
		return
	}

	const ctx: FlowContext = {
		command,
		pm: detected.pm,
		spec: options.specVer ?? null,
		current: detected.version,
		jsonMode,
		dryRun
	}

	const meta = await fetchOrReport(ctx)

	if (!meta) {
		return
	}

	const spec: ParsedSpec | undefined = options.specVer ? parseSpec(options.specVer) : undefined
	const resolved = resolveTarget(spec, detected.version, meta, 'upgrade')

	if (resolved.direction === 'invalid') {
		const result = {
			...baseResult(detected.pm, PKG, false),
			command,
			result: 'error' as CommandResultStatus,
			spec: options.specVer ?? null,
			current: detected.version,
			error: {
				code: 'SPEC_INVALID',
				message: resolved.message
			}
		}

		if (jsonMode) {
			logger.json(result)
		} else {
			logger.error(resolved.message)
		}

		process.exitCode = 1

		return
	}

	if (resolved.direction === 'noop') {
		const result = {
			...baseResult(detected.pm, PKG, false),
			command,
			result: 'noop' as CommandResultStatus,
			spec: options.specVer ?? null,
			current: detected.version,
			target: null,
			majorBump: resolved.majorBump,
			message: resolved.message
		}

		if (jsonMode) {
			logger.json(result)
		} else {
			logger.info(resolved.message)
		}

		process.exitCode = 0

		return
	}

	// Major-bump warning prints standalone (not inside the prompt) so it
	// surfaces in human mode even when --yes skips confirmation.
	if (resolved.majorBump && !jsonMode) {
		logger.warn('⚠️  Major version bump. Breaking changes likely.')
	}

	const confirmed = await confirmOrCancel(
		{
			...options,
			// A major jump is breaking — gate it behind explicit consent in
			// non-interactive runs. Dry-run mutates nothing, so it never gates.
			destructive: resolved.majorBump === true && !dryRun
		},
		`Upgrade ${PKG} from ${resolved.current} to ${resolved.target} via ${PM_DISPLAY_NAMES[detected.pm]}?\nWill run: ${willRunOf(detected.pm, resolved.target)}`,
		{
			...baseResult(detected.pm, PKG, dryRun),
			command,
			result: 'cancelled' as CommandResultStatus,
			spec: options.specVer ?? null,
			current: detected.version,
			target: resolved.target,
			majorBump: resolved.majorBump,
			message: 'Cancelled by user'
		}
	)

	if (!confirmed) {
		return
	}

	const result = await installOrReport(ctx, resolved.target, resolved.majorBump, dryRun)

	if (!result) {
		return
	}

	if (jsonMode) {
		logger.json({
			...baseResult(detected.pm, PKG, dryRun),
			command,
			result: (dryRun ? 'dry-run' : 'success') as CommandResultStatus,
			spec: options.specVer ?? null,
			current: detected.version,
			target: resolved.target,
			majorBump: resolved.majorBump,
			cmdStr: result.cmdStr,
			message: dryRun ? `[dry-run] Would upgrade ${PKG} to ${resolved.target}` : `Upgraded ${PKG} to ${resolved.target}`
		})
	} else {
		printSuccess(`Upgrade ${PKG} to ${resolved.target}`, dryRun)
	}
}

// Re-export ResolveResult type for typecheck usage in other modules
export type { ResolveResult, DetectedPM, ParsedSpec }
