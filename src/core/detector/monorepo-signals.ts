import { existsSync } from 'node:fs'

import { join } from 'pathe'

export interface MonorepoSignals {
	/** Artifact that triggered detection, named for the abort hint. */
	evidence: string
}

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const

const hasWorkspaceProtoDep = (manifest: Record<string, unknown>): boolean =>
	DEP_FIELDS.some((field) => {
		const deps = manifest[field]

		if (typeof deps !== 'object' || deps === null) {
			return false
		}

		return Object.values(deps as Record<string, unknown>).some(
			(spec) => typeof spec === 'string' && spec.startsWith('workspace:')
		)
	})

export const detectMonorepo = (cwd: string, manifest: Record<string, unknown>): MonorepoSignals | null => {
	if (existsSync(join(cwd, 'pnpm-workspace.yaml'))) {
		return { evidence: 'pnpm-workspace.yaml' }
	}

	const workspaces = manifest.workspaces

	if (
		typeof workspaces === 'object' &&
		workspaces !== null &&
		Array.isArray((workspaces as Record<string, unknown>).packages) &&
		(workspaces as { packages: unknown[] }).packages.length > 0
	) {
		return { evidence: 'package.json "workspaces" field' }
	}

	if (hasWorkspaceProtoDep(manifest)) {
		return { evidence: 'workspace:* protocol dependency' }
	}

	return null
}
