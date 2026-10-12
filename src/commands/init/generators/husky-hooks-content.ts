import { Agent } from 'package-manager-detector'

import { fmtCommand, localBinCommand } from '@/core/runner/pm-commands'

export type HuskyHookName = 'pre-commit' | 'commit-msg'

// Hooks call locally installed bins through the PM so they work in every
// project layout.
export const buildHookContent = (hook: HuskyHookName, pm: Agent): string => {
	const body =
		hook === 'pre-commit'
			? fmtCommand(localBinCommand(pm, 'lint-staged'))
			: fmtCommand(localBinCommand(pm, 'commitlint', ['--edit', '"$1"']))

	return `#!/usr/bin/env sh\n${body}\n`
}

// Keep every user line, drop the husky sample command,
// and guarantee exactly one occurrence of the managed line. Only init's own
// `#!/usr/bin/env sh` is stripped — a bash hook (`#!/usr/bin/env bash`)
// keeps its interpreter so user-authored syntax still runs.
export const mergeHookContent = (existing: string, managedLine: string): string => {
	const INIT_SHEBANG = '#!/usr/bin/env sh'

	const kept = existing
		.split('\n')
		.filter((line) => {
			const trimmed = line.trim()

			return trimmed.length > 0 && trimmed !== 'npm test' && trimmed !== managedLine
		})
		.filter((line) => line !== INIT_SHEBANG)

	const userLines = kept.length > 0 ? [...kept, ''] : []

	return `${INIT_SHEBANG}\n${userLines.join('\n')}${managedLine}\n`
}
