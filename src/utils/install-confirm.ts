/**
 * Install Confirmation Gate
 * Interactive 3-mode flow: Install now / Save to package.json only / Cancel.
 * Non-interactive (-y) always auto-installs (no flag to force save-only).
 * Save-only mode edits package.json devDependencies without running a package manager.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { confirm, select } from '@clack/prompts'
import { colors } from 'consola/utils'
import { join } from 'pathe'

import { logger } from '@/utils/logger'
import { InstallPlan } from '@/commands/init/utils/setup-pkgs'
import { LinterState } from '@/utils/linter-detector'
import { PackageConflict } from '@/utils/conflict-detector'

/** Map linter package name → display name. */
const LINTER_DISPLAY: Record<string, string> = {
	eslint: 'ESLint',
	'@biomejs/biome': 'Biome',
	oxlint: 'Oxlint'
}

/**
 * Non-ESLint linters present in the repo — these conflict with jss-devtools
 * (which uses ESLint). ESLint is excluded because it is not a conflict.
 */
const conflictingLinterNames = (linter: LinterState): string[] =>
	linter.packages.filter((p) => p !== 'eslint').map((p) => LINTER_DISPLAY[p] || p)

export type InstallSelection = 'install' | 'save-only' | 'cancel'
export type ConfigAction = 'replace' | 'keep' | 'cancel'

export interface ConfirmOptions {
	/** Non-interactive (-y): auto-pick "install". */
	nonInteractive: boolean
}

/** Render the plan summary (packages to install). Already-installed packages
 * are skipped silently, so they are intentionally not shown here. */
const renderSummary = (plan: InstallPlan): void => {
	const { toInstall } = plan

	if (toInstall.length === 0) {
		logger.info('All dependencies already installed. Nothing to install.')
		return
	}

	logger.info(`📦 ${toInstall.length} devDependencies to add:`)
	for (const entry of toInstall) {
		logger.info(`   • ${entry.spec}`) // e.g. "eslint@8.57.1"
	}

	// Already-installed (non-conflicting) packages are skipped silently — no log.
}

/**
 * Resolve install mode.
 * - nonInteractive (-y) → 'install' (default behavior, same as user selecting "Install now").
 * - 0 packages to install → 'install' (caller skips execution anyway).
 * - interactive → clack 3-mode select.
 */
export const confirmInstallation = async (plan: InstallPlan, options: ConfirmOptions): Promise<InstallSelection> => {
	renderSummary(plan)

	// Nothing to install → caller skips regardless.
	if (plan.toInstall.length === 0) {
		return 'install'
	}

	if (options.nonInteractive) {
		return 'install'
	}

	const selection = await select({
		message: 'How would you like to install?',
		initialValue: 'save-only' as InstallSelection,
		options: [
			{ value: 'save-only', label: 'Save to package.json only (install later)' },
			{ value: 'install', label: 'Install now' },
			{ value: 'cancel', label: 'Cancel — no changes' }
		]
	})

	return selection as InstallSelection
}

/**
 * Mode B: merge planned packages into package.json devDependencies.
 * Pure JSON edit — no package manager invoked, no network, no node_modules.
 * Range format ("^8.57.1") is the latest version fetched from npm registry.
 */
export const saveToPackageJson = (plan: InstallPlan, cwd: string = process.cwd()): void => {
	const pkgPath = join(cwd, 'package.json')
	if (!existsSync(pkgPath)) {
		logger.error('package.json not found. Cannot save dependencies.')
		return
	}

	let pkg: Record<string, any>
	try {
		pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
	} catch {
		logger.error('Invalid package.json. Cannot save dependencies.')
		return
	}

	if (!pkg.devDependencies || typeof pkg.devDependencies !== 'object') {
		pkg.devDependencies = {}
	}

	let added = 0
	for (const entry of plan.toInstall) {
		if (entry.dev) {
			pkg.devDependencies[entry.name] = entry.range // e.g. "eslint": "^8.57.1"
			added++
		}
	}

	// Sort devDependencies for stable output.
	pkg.devDependencies = Object.fromEntries(Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)))

	writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t'), 'utf8')
	logger.success(`Saved ${added} devDependencies to package.json (no install yet).`)
	logger.info('Run your package manager install (e.g. `npm install`) to download them.')
}

/**
 * Ask how to handle an existing config for a tool.
 * - nonInteractive (-y) → 'replace' (preserve old auto-overwrite behavior).
 * - interactive → clack select: Replace / Keep / Cancel.
 * Only called when config files were detected; absent configs auto-generate without asking.
 */
export const promptConfigAction = async (
	toolName: string,
	foundFiles: string[],
	options: ConfirmOptions
): Promise<ConfigAction> => {
	logger.info(`🔍 Detected existing ${toolName} config: ${foundFiles.join(', ')}`)

	if (options.nonInteractive) {
		logger.info(`Non-interactive mode: replacing ${toolName} config.`)
		return 'replace'
	}

	const action = await select({
		message: `How to handle existing ${toolName} config?`,
		initialValue: 'replace' as ConfigAction,
		options: [
			{ value: 'replace', label: 'Replace with jss-devtools config' },
			{ value: 'keep', label: 'Keep existing (skip generation)' },
			{ value: 'cancel', label: 'Cancel setup' }
		]
	})

	return action as ConfigAction
}

/**
 * Ask user about linter coexistence.
 * ESLint alone → silent auto-continue (jss-devtools uses ESLint, no conflict).
 * Any other linter (Biome/Oxlint/mixed) → warn and ask, defaulting to continue.
 * Returns true to continue, false to cancel.
 */
export const confirmLinterCoexistence = async (linter: LinterState, options: ConfirmOptions): Promise<boolean> => {
	// ESLint-only or no linter → no conflict → auto-continue silently.
	const names = conflictingLinterNames(linter)
	if (names.length === 0) return true

	// Warn with only the conflicting (non-ESLint) linters, styled to stand out.
	const styled = names.map((n) => colors.bold(n)).join(', ')
	const noun = names.length > 1 ? 'linters' : 'linter'
	logger.warn(`⚠️  Detected existing ${noun}: ${styled}`)

	if (options.nonInteractive) {
		logger.info('Non-interactive mode: continuing with existing linter.')
		return true
	}

	const shouldContinue = await confirm({
		message: `${names.join(', ')} already installed. Continue jss-devtools setup (may cause conflicts)?`,
		initialValue: true
	})

	if (shouldContinue === false) {
		logger.warn('Setup cancelled due to existing linter.')
		return false
	}

	return true
}

/**
 * Resolve package conflicts between installed and planned versions.
 * Returns proceed=false to cancel, or proceed=true with the list of package
 * names the user opted to overwrite. Skipped/compatible packages are kept as-is.
 */
export const resolvePackageConflicts = async (
	conflicts: PackageConflict[],
	options: ConfirmOptions
): Promise<{ proceed: boolean; overwrite: string[] }> => {
	// No conflicts → continue, nothing to overwrite.
	if (conflicts.length === 0) return { proceed: true, overwrite: [] }

	const incompatible = conflicts.filter((c) => !c.isCompatible)

	// Compatible (same-major) packages are silently skipped — no install, no log.
	// Only incompatible version mismatches are surfaced to the user.
	if (incompatible.length === 0) return { proceed: true, overwrite: [] }

	// Show incompatible version conflicts as a single compact block — one line
	// per package (name+version → name+version), both sides bold, no blank lines.
	const conflictLines = incompatible
		.map(
			(c) =>
				`   ${colors.bold(`${c.name}${c.installedVersion}`)} → ${colors.bold(`${c.name}${c.plannedVersion}`)}`
		)
		.join('\n')
	logger.warn(`⚠️  Detected version conflicts:\n${conflictLines}`)

	if (options.nonInteractive) {
		logger.info('Non-interactive mode: skipping conflicting packages.')
		return { proceed: true, overwrite: [] }
	}

	const action = await select({
		message: 'How to handle conflicts?',
		initialValue: 'overwrite' as string,
		options: [
			{
				value: 'overwrite',
				label: 'Overwrite with new version (may cause breaking changes)'
			},
			{
				value: 'skip',
				label: 'Skip conflicting packages (keep current version)'
			},
			{
				value: 'cancel',
				label: 'Cancel setup'
			}
		]
	})

	if (action === 'cancel') {
		logger.warn('Setup cancelled due to package conflicts.')
		return { proceed: false, overwrite: [] }
	}

	const overwriteNames = incompatible.map((c) => c.name)
	if (action === 'overwrite') {
		logger.info(`Will overwrite: ${overwriteNames.join(', ')}`)
		return { proceed: true, overwrite: overwriteNames }
	}

	// skip → keep current versions.
	return { proceed: true, overwrite: [] }
}
