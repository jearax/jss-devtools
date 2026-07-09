/**
 * Repo State Detector
 * Detect existing dependencies, configs, and framework to enable
 * conditional install (skip duplicates) and smart defaults.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'pathe'

import { Framework } from '@/commands/init/types/setup-pkgs'
import { detectLinter, LinterState } from '@/utils/linter-detector'

export interface RepoTools {
	/** ESLint config detection result: 'none' | 'v8' | 'v9' | 'legacy' | 'flat' */
	eslint: 'none' | 'v8' | 'v9' | 'legacy' | 'flat'
	/** Prettier config exists (.prettierrc.*) */
	prettier: boolean
	/** Husky already initialized (.husky dir) */
	husky: boolean
	/** lint-staged configured in package.json */
	lintStaged: boolean
}

export interface RepoState {
	/** package.json exists in cwd */
	hasPackageJson: boolean
	/** All dependencies + devDependencies keys (lowercased) */
	installedPackages: Set<string>
	/** Package versions: name → version string */
	packageVersions: Map<string, string>
	/** Detected framework from dependencies, undefined if unknown */
	framework?: Framework
	/** Existing tooling state */
	tools: RepoTools
	/** Linter detection state */
	linter: LinterState
}

/** Read and parse package.json safely. Returns undefined if missing/invalid. */
const readPackageJson = (cwd: string): Record<string, any> | undefined => {
	const pkgPath = join(cwd, 'package.json')
	if (!existsSync(pkgPath)) return undefined

	try {
		return JSON.parse(readFileSync(pkgPath, 'utf8'))
	} catch {
		return undefined
	}
}

/** Detect framework from dependency presence. Order matters (nextjs before react). */
const detectFramework = (deps: Record<string, string>): Framework | undefined => {
	if (deps['next']) return 'nextjs'
	if (deps['react-native'] || deps['react-native-scripts']) return 'react-native'
	if (deps['react'] || deps['react-dom']) return 'react'
	return undefined
}

/** Detect ESLint state from existing config files. */
const detectEslintTool = (cwd: string): RepoTools['eslint'] => {
	// Flat config (eslint.config.*) = ESLint 9+ or 8 backport
	const flatConfigs = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs']
	const hasFlat = flatConfigs.some((f) => existsSync(join(cwd, f)))

	// Legacy config (.eslintrc.*)
	const legacyConfigs = ['.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yaml', '.eslintrc.yml']
	const hasLegacy = legacyConfigs.some((f) => existsSync(join(cwd, f)))

	if (hasFlat) return 'flat'
	if (hasLegacy) return 'legacy'
	return 'none'
}

/**
 * Detect current repo state: packages, framework, tooling, linter.
 * Pure read-only — no side effects.
 */
export const detectRepoState = (cwd: string = process.cwd()): RepoState => {
	const pkg = readPackageJson(cwd)
	const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) }

	const installedPackages = new Set(Object.keys(deps))
	const packageVersions = new Map<string, string>(Object.entries(deps) as [string, string][])

	// Detect tools
	const eslint = detectEslintTool(cwd)
	const prettierPatterns = [
		'.prettierrc',
		'.prettierrc.json',
		'.prettierrc.js',
		'.prettierrc.cjs',
		'.prettierrc.yaml',
		'.prettierrc.yml'
	]
	const prettier = prettierPatterns.some((f) => existsSync(join(cwd, f)))
	const husky = existsSync(join(cwd, '.husky'))
	const lintStaged = Boolean(pkg?.['lint-staged'])

	// Detect linter
	const linter = detectLinter(cwd)

	return {
		hasPackageJson: Boolean(pkg),
		installedPackages,
		packageVersions,
		framework: detectFramework(deps),
		tools: { eslint, prettier, husky, lintStaged },
		linter
	}
}
