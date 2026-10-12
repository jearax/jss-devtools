export const PNPM_WORKSPACE_PATH = 'pnpm-workspace.yaml'

// eslint-plugin-import-x pulls in unrs-resolver, whose postinstall pnpm 11
// refuses to run unless allowed (onlyBuiltDependencies was removed in v11).
const PACKAGE = 'unrs-resolver'
const ENTRY = `  ${PACKAGE}: true`

export type PnpmWorkspaceOutcome = { kind: 'write'; content: string } | { kind: 'skip'; reason: string }

// Line-level merge keeps the user's comments and ordering; anything other
// than a block-style `allowBuilds:` map is left alone.
export const mergePnpmAllowBuilds = (existing: string | null): PnpmWorkspaceOutcome => {
	if (existing === null) {
		return {
			kind: 'write',
			content: `allowBuilds:\n${ENTRY}\n`
		}
	}

	if (new RegExp(`^\\s+['"]?${PACKAGE}['"]?\\s*:`, 'm').test(existing)) {
		return {
			kind: 'write',
			content: existing
		}
	}

	const lines = existing.split('\n')
	const header = lines.findIndex((line) => /^allowBuilds\s*:/.test(line))

	if (header === -1) {
		const base = existing.length === 0 || existing.endsWith('\n') ? existing : `${existing}\n`

		return {
			kind: 'write',
			content: `${base}allowBuilds:\n${ENTRY}\n`
		}
	}

	if (!/^allowBuilds\s*:\s*(#.*)?$/.test(lines[header] ?? '')) {
		return {
			kind: 'skip',
			reason: `inline allowBuilds value — add "${PACKAGE}: true" manually`
		}
	}

	lines.splice(header + 1, 0, ENTRY)

	return {
		kind: 'write',
		content: lines.join('\n')
	}
}
