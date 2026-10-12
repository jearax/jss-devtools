import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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

// pnpm 10+ single-package projects keep settings (allowBuilds, …) in
// pnpm-workspace.yaml; only a `packages` key makes it a workspace.
const declaresPnpmPackages = (cwd: string): boolean => {
	const path = join(cwd, 'pnpm-workspace.yaml')

	return existsSync(path) && /^packages\s*:/m.test(readFileSync(path, 'utf8'))
}

export const detectMonorepo = (cwd: string, manifest: Record<string, unknown>): MonorepoSignals | null => {
	if (declaresPnpmPackages(cwd)) {
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
