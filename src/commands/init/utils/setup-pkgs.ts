import type { PackageManager } from 'nypm'
import { execa } from 'execa'

import { addDependency, addDevDependency } from '@/utils/package-installer'
import { PackageToInstall, SetupAnswers } from '@/commands/init/types/setup-pkgs'
import { RepoState } from '@/utils/repo-detector'
import { logger } from '@/utils/logger'
import { extractMajor, parseMajors } from '@/utils/semver-helpers'
import { peerDependencies } from '../../../../package.json'

/** The declared peerDependencies range for a package (e.g. "^6.0.0 || ^7.0.0"), if any. */
const peerRange = (pkgName: string): string | undefined => peerDependencies[pkgName as keyof typeof peerDependencies]

let offlineWarned = false
/** Warn once when the npm registry is unreachable. */
const warnOffline = (): void => {
	if (offlineWarned) return
	offlineWarned = true
	logger.warn('⚠️  Offline: cannot reach the npm registry. Using declared version ranges.')
}

/** Run `npm view <pkg> <field> --json` with a timeout. Throws on registry/network failure. */
const npmView = async (pkgName: string, field: string): Promise<string> => {
	const { stdout } = await execa('npm', ['view', pkgName, field], {
		stdio: 'pipe',
		timeout: 10000
	})
	return stdout
}

/** Latest published stable (non-prerelease) version, or null on registry failure. */
const fetchLatest = async (pkgName: string): Promise<string | null> => {
	try {
		const stdout = await npmView(pkgName, 'versions --json')
		const versions: string[] = JSON.parse(stdout)
		const stable = versions.filter((v) => !v.includes('-'))
		return stable[stable.length - 1] ?? null
	} catch {
		return null
	}
}

/** Latest stable version within a specific major, or null on registry failure. */
const fetchLatestInMajor = async (pkgName: string, major: number): Promise<string | null> => {
	try {
		const stdout = await npmView(pkgName, 'versions --json')
		const versions: string[] = JSON.parse(stdout)
		const inMajor = versions
			.filter((v) => v.startsWith(`${major}.`) && !v.includes('-'))
			.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
		return inMajor[0] ?? null
	} catch {
		return null
	}
}

const versionCache = new Map<string, string | null>()

/**
 * Resolve the exact latest version for a package.
 * Prefers the consumer's already-installed major when it is within the declared
 * compat range (so we never downgrade/pin against their choice); otherwise picks
 * the highest declared major. Returns null when offline/unreachable. Cached.
 *
 * @param installedVersion consumer's current version string (e.g. "^8.62.0"), if any
 */
const resolveVersion = async (pkgName: string, installedVersion?: string): Promise<string | null> => {
	const range = peerRange(pkgName)
	if (!range) return null

	const majors = parseMajors(range)

	// Open range (>=, *) or no pinned major → absolute latest
	const targetMajor =
		majors.length === 0
			? null
			: (() => {
					const installedMajor = extractMajor(installedVersion ?? '')
					if (installedMajor !== null && majors.includes(installedMajor)) return installedMajor
					return Math.max(...majors)
				})()

	const cacheKey = targetMajor === null ? `${pkgName}@latest` : `${pkgName}@${targetMajor}`
	if (versionCache.has(cacheKey)) {
		return versionCache.get(cacheKey)! ?? null
	}

	const version = targetMajor === null ? await fetchLatest(pkgName) : await fetchLatestInMajor(pkgName, targetMajor)
	versionCache.set(cacheKey, version)
	return version
}

/**
 * Build install spec (e.g. "eslint@8.57.1"). Prefers the consumer's installed
 * major when compatible. On offline, falls back to the declared range.
 */
export const buildPkgSpec = async (pkgName: string, installedVersion?: string): Promise<string> => {
	const version = await resolveVersion(pkgName, installedVersion)
	if (version) return `${pkgName}@${version}`

	// Offline → use declared range.
	warnOffline()
	const range = peerRange(pkgName)
	return range ? `${pkgName}@${range}` : pkgName
}

/**
 * Full version range for package.json (e.g. "^8.57.1"). On offline, returns
 * the declared peerDependencies range.
 */
export const buildPkgRange = async (pkgName: string, installedVersion?: string): Promise<string> => {
	const version = await resolveVersion(pkgName, installedVersion)
	if (version) return `^${version}`

	// Offline → use declared range.
	warnOffline()
	const range = peerRange(pkgName)
	return range ?? '*'
}

/** Flatten conditional package definitions into individual names. */
const flattenPackages = (pkgs: PackageToInstall[]): string[] =>
	pkgs.flatMap((pkg) => (Array.isArray(pkg.name) ? pkg.name : [pkg.name]))

/** Filter conditional packages by current answers. */
const setupConditionalPackages = (pkgs: PackageToInstall[], answers: SetupAnswers): PackageToInstall[] =>
	pkgs.filter((dep) => (dep.condition ? dep.condition(answers) : true))

export interface InstallPlanEntry {
	name: string
	spec: string // full version spec, e.g. "eslint@8.57.1"
	range: string // full version range, e.g. "^8.57.1"
	dev: boolean
}

export interface InstallPlan {
	/** Packages not yet present in package.json, ready to install/save. */
	toInstall: InstallPlanEntry[]
	/** Package names already in package.json (skipped to avoid duplicates). */
	skipped: string[]
}

/**
 * The full set of packages jss-devtools manages, split into always-on common
 * tools and framework/feature-conditional formatter deps. Extracted so both
 * conflict detection (full intended list) and install planning share one source.
 */
const getPackageDefinitions = (): { common: PackageToInstall[]; formatter: PackageToInstall[] } => ({
	common: [
		{ name: 'typescript', dev: true },
		{ name: 'husky', dev: true },
		{ name: 'lint-staged', dev: true }
	],
	formatter: [
		{ name: 'prettier', dev: true },
		{ name: 'eslint', dev: true },
		{ name: '@eslint/js', dev: true },
		{ name: 'globals', dev: true },
		// Use the typescript-eslint meta-package (bundles parser + plugin). For
		// ESLint 8 flat config this is all that's needed. Standalone
		// `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` were
		// removed — re-add them here if a future ESLint 9 setup needs them split.
		{ name: 'typescript-eslint', dev: true },
		{ name: 'eslint-config-prettier', dev: true },
		{ name: 'eslint-plugin-autofix', dev: true },
		{ name: 'eslint-plugin-import', dev: true },
		{ name: 'eslint-plugin-prefer-arrow-functions', dev: true },
		// Framework-conditional
		{
			name: ['eslint-plugin-react', 'eslint-plugin-react-hooks'],
			dev: true,
			condition: (a: SetupAnswers) => ['react', 'react-native', 'nextjs'].includes(a.framework)
		},
		{
			name: 'eslint-plugin-react-native',
			dev: true,
			condition: (a: SetupAnswers) => a.framework === 'react-native'
		},
		// jsx-a11y is web-only (React/Next); not applicable to React Native
		{
			name: 'eslint-plugin-jsx-a11y',
			dev: true,
			condition: (a: SetupAnswers) => ['react', 'nextjs'].includes(a.framework)
		},
		{
			name: '@next/eslint-plugin-next',
			dev: true,
			condition: (a: SetupAnswers) => ['nextjs'].includes(a.framework)
		},
		{
			name: ['eslint-plugin-tailwindcss', 'prettier-plugin-tailwindcss'],
			dev: true,
			condition: (a: SetupAnswers) => a.useTailwind === true
		},
		{
			name: 'eslint-plugin-storybook',
			dev: true,
			condition: (a: SetupAnswers) => a.useStorybook === true
		}
	]
})

/**
 * Resolve the full intended package list for given answers, with the range
 * jss-devtools pins (from peerDependencies). No network calls — intended for
 * conflict detection against the user's currently-installed versions.
 * Returns name → range (e.g. "eslint-plugin-react" → "^7.0.0").
 */
export const getIntendedRanges = (answers: SetupAnswers): Map<string, string> => {
	const { common, formatter } = getPackageDefinitions()
	const selected = setupConditionalPackages([...common, ...formatter], answers)
	const names = flattenPackages(selected)

	const ranges = new Map<string, string>()
	for (const name of names) {
		const range = peerDependencies[name as keyof typeof peerDependencies]
		if (range) ranges.set(name, range)
	}
	return ranges
}

/**
 * Build the dependency list for given answers, partitioned against the current
 * repo state. Already-installed packages are skipped unless listed in
 * `overwrite` (user opted to overwrite conflicting versions). Fetches latest
 * versions from the npm registry during execution.
 */
export const buildInstallPlan = async (
	answers: SetupAnswers,
	repoState: RepoState,
	overwrite: string[] = []
): Promise<InstallPlan> => {
	const { common, formatter } = getPackageDefinitions()
	const selected = setupConditionalPackages([...common, ...formatter], answers)

	const allNames = flattenPackages(selected)
	const overwriteSet = new Set(overwrite)
	const skipped: string[] = []
	const toInstall: InstallPlanEntry[] = []

	// Fetch all versions in parallel for better performance.
	// Skip already-installed packages unless the user chose to overwrite them.
	// Pass the consumer's installed version so we keep their major when compatible.
	const versionPromises = allNames.map(async (name) => {
		if (repoState.installedPackages.has(name) && !overwriteSet.has(name)) {
			return null
		}
		const installed = repoState.packageVersions.get(name)
		const spec = await buildPkgSpec(name, installed)
		const range = await buildPkgRange(name, installed)
		return { name, spec, range, dev: true }
	})

	const results = await Promise.all(versionPromises)

	for (const result of results) {
		if (!result) continue
		toInstall.push(result)
	}

	// Fill skipped list (installed and NOT overwritten).
	for (const name of allNames) {
		if (repoState.installedPackages.has(name) && !overwriteSet.has(name)) {
			skipped.push(name)
		}
	}

	return { toInstall, skipped }
}

/**
 * Execute install via the detected package manager (Mode A: install now).
 * Runs addDependency/addDevDependency which delegate to execa with cwd set.
 */
export const executeInstall = async (plan: InstallPlan, pm: PackageManager): Promise<void> => {
	const devSpecs = plan.toInstall.filter((p) => p.dev).map((p) => p.spec)
	const prodSpecs = plan.toInstall.filter((p) => !p.dev).map((p) => p.spec)

	// Sequential awaits prevent EEXIST race in concurrent bun link operations.
	if (prodSpecs.length > 0) {
		await addDependency(prodSpecs, pm)
	}
	if (devSpecs.length > 0) {
		await addDevDependency(devSpecs, pm)
	}
}
