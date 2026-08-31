import { execa } from 'execa'

import { CommandSpec, fmtCommand } from '@/core/runner/pm-commands'
import { logger } from '@/utils/logger'

export interface RunCommandResult {
	ok: boolean
	cmdStr: string
}

export interface RunCommandOptions {
	/** Suppress the "Executing:" log line (git init stays silent by design). */
	silent?: boolean
	/** Buffer child stdio — json mode needs clean stdout. */
	capture?: boolean
}

export const runCommandSpec = async (spec: CommandSpec, options?: RunCommandOptions): Promise<RunCommandResult> => {
	const cmdStr = fmtCommand(spec)

	if (options?.silent !== true) {
		logger.info(`Executing: ${cmdStr}`)
	}

	try {
		await execa(spec.command, spec.args, {
			stdio: options?.capture === true ? 'pipe' : 'inherit'
		})
	} catch (error) {
		logger.debug(`Command failed: ${cmdStr} — ${error instanceof Error ? error.message : String(error)}`)

		return {
			ok: false,
			cmdStr
		}
	}

	return {
		ok: true,
		cmdStr
	}
}
