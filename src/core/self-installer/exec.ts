import { execa } from 'execa'
import { resolveCommand, AgentName } from 'package-manager-detector'

import { PM_DISPLAY_NAMES } from '@/core/detector/global-pm'
import { logger } from '@/utils/logger'

export interface ExecResult {
	ok: boolean
	dryRun: boolean
	cmdStr: string
	pm: AgentName
}

const fmt = (pm: AgentName, args: string[]): string => `${PM_DISPLAY_NAMES[pm]} ${args.join(' ')}`

const execOrDryRun = async (
	pm: AgentName,
	verb: 'global' | 'global_uninstall',
	pkgSpec: string,
	dryRun: boolean
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
	await execa(resolved.command, resolved.args, { stdio: 'inherit' })
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
	dryRun: boolean
): Promise<ExecResult> => execOrDryRun(pm, 'global', `${pkg}@${version}`, dryRun)

export const execOrDryRunRemove = (pm: AgentName, pkg: string, dryRun: boolean): Promise<ExecResult> =>
	execOrDryRun(pm, 'global_uninstall', pkg, dryRun)
