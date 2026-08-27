import { execa } from 'execa'
import { resolveCommand, AgentName } from 'package-manager-detector'

import { logger } from '@/utils/logger'

export interface ExecResult {
	ok: boolean
	dryRun: boolean
	cmdStr: string
	pm: AgentName
}

export interface ExecOptions {
	/**
	 * Buffer child stdio inside execa instead of sharing the terminal. Json
	 * mode needs this: PM chatter on the shared stdout would corrupt the
	 * single JSON document contract. Human mode keeps 'inherit' so the user
	 * watches live output.
	 */
	capture?: boolean
}

// cmdStr is a machine-facing payload field (copy-paste runnable) — raw pm
// name, never the display name ("yarn (classic)" would not execute).
const fmt = (pm: AgentName, args: string[]): string => `${pm} ${args.join(' ')}`

const execOrDryRun = async (
	pm: AgentName,
	verb: 'global' | 'global_uninstall',
	pkgSpec: string,
	dryRun: boolean,
	options?: ExecOptions
): Promise<ExecResult> => {
	const resolved = resolveCommand(pm, verb, [pkgSpec])

	if (!resolved) {
		throw new Error(`No ${verb} command for ${pm}`)
	}

	const cmdStr = fmt(pm, resolved.args)

	if (dryRun) {
		logger.info(`[dry-run] Would execute: ${cmdStr}`)
		return {
			ok: true,
			dryRun: true,
			cmdStr,
			pm
		}
	}

	logger.info(`Executing: ${cmdStr}`)
	await execa(resolved.command, resolved.args, {
		stdio: options?.capture === true ? 'pipe' : 'inherit'
	})

	// Captured child output is deliberately discarded on success: machine
	// consumers must receive exactly one JSON document, nothing else.
	return {
		ok: true,
		dryRun: false,
		cmdStr,
		pm
	}
}

export const execOrDryRunInstall = (
	pm: AgentName,
	pkg: string,
	version: string,
	dryRun: boolean,
	options?: ExecOptions
): Promise<ExecResult> => execOrDryRun(pm, 'global', `${pkg}@${version}`, dryRun, options)

export const execOrDryRunRemove = (
	pm: AgentName,
	pkg: string,
	dryRun: boolean,
	options?: ExecOptions
): Promise<ExecResult> => execOrDryRun(pm, 'global_uninstall', pkg, dryRun, options)
