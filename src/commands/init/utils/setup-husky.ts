import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { PackageManager } from 'nypm'
import { join } from 'pathe'

import { getPMExecCommand } from '@/commands/init/utils/pm'
import { isGitRepo } from '@/utils/git-detector'
import { logger } from '@/utils/logger'

/** The exact lint-staged command line jss-devtools owns. */
const lintStagedLine = (pm: PackageManager): string => `${getPMExecCommand(pm)} lint-staged`

/**
 * Write .husky/pre-commit by MERGING the user's pre-init content with ours:
 * - no prior hook → write ours
 * - otherwise → keep all real user lines, drop the husky `npm test` sample and
 *   any existing exact lint-staged line, then ensure exactly one clean
 *   lint-staged line. `husky init` clobbers pre-commit, so user content is
 *   captured BEFORE init and re-merged here.
 */
const writePreCommitHook = (cwd: string, pm: PackageManager, priorContent: string | null): void => {
	const hookPath = join(cwd, '.husky', 'pre-commit')
	const ours = lintStagedLine(pm)

	if (priorContent === null) {
		writeFileSync(hookPath, `#!/bin/sh\n${ours}\n`, { mode: 0o755 })
		return
	}

	const rawLines = priorContent.split('\n').map((l) => l.trim())
	const hasOurs = rawLines.includes(ours)

	// Real user lines: drop shebang, blanks, the husky `npm test` sample, and
	// the exact lint-staged line (re-added once, cleanly, below).
	const userLines = rawLines.filter(
		(l) => l !== '' && !l.startsWith('#!') && l !== 'npm test' && l !== ours
	)

	const lines = ['#!/bin/sh', ...userLines, ...(hasOurs ? [] : [ours])]
	writeFileSync(hookPath, `${lines.join('\n')}\n`, { mode: 0o755 })
}

export const setupHusky = async ({ pm }: { pm: PackageManager }) => {
	try {
		const cwd = process.cwd()
		const hookPath = join(cwd, '.husky', 'pre-commit')

		// Capture user's pre-init content BEFORE husky init (which overwrites it).
		const priorContent = existsSync(hookPath) ? readFileSync(hookPath, 'utf8') : null

		// Initialize git if needed. `-b main` sets the initial branch to `main`
		// (git 2.28+); output is suppressed (handled silently).
		if (!isGitRepo()) {
			execSync('git init -b main', { cwd, stdio: 'ignore' })
		}

		// husky init sets up .husky/ + the prepare script.
		execSync(`${getPMExecCommand(pm)} husky init`, { cwd })

		writePreCommitHook(cwd, pm, priorContent)

		logger.success('Initialized Husky')
	} catch (error) {
		logger.error('Failed to setup husky')
		if (error instanceof Error) {
			logger.error(error.message)
		}
	}
}
