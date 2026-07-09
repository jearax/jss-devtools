/**
 * Config File Detector
 * Detect existing ESLint and Prettier configuration files per official docs.
 * Sources:
 *   - ESLint:  https://eslint.org/docs/latest/use/configure/configuration-files
 *   - Prettier: https://prettier.io/docs/configuration
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'

/** All ESLint configuration file names (flat + legacy). */
export const ESLINT_CONFIG_FILES = [
	// Flat config (ESLint 9+ / 8 backport)
	'eslint.config.js',
	'eslint.config.mjs',
	'eslint.config.cjs',
	// Legacy config (.eslintrc.*)
	'.eslintrc.js',
	'.eslintrc.cjs',
	'.eslintrc.json',
	'.eslintrc.yaml',
	'.eslintrc.yml',
	'.eslintrc'
] as const

/** All Prettier configuration file names. */
export const PRETTIER_CONFIG_FILES = [
	'.prettierrc',
	'.prettierrc.json',
	'.prettierrc.yaml',
	'.prettierrc.yml',
	'.prettierrc.js',
	'.prettierrc.cjs',
	'.prettierrc.mjs',
	'.prettierrc.toml',
	'prettier.config.js',
	'prettier.config.cjs',
	'prettier.config.mjs'
] as const

/** Read package.json safely. Returns undefined if missing/invalid. */
const readPackageJson = (cwd: string): Record<string, any> | undefined => {
	const pkgPath = join(cwd, 'package.json')
	if (!existsSync(pkgPath)) return undefined
	try {
		return JSON.parse(readFileSync(pkgPath, 'utf8'))
	} catch {
		return undefined
	}
}

/**
 * Detect existing config files for a tool. Includes package.json field presence
 * (e.g. eslintConfig / prettier) as a pseudo "package.json" entry.
 */
const detectConfigFiles = (cwd: string, files: readonly string[], pkgField?: string): string[] => {
	const found: string[] = []

	for (const file of files) {
		if (existsSync(join(cwd, file))) {
			found.push(file)
		}
	}

	// Check package.json inline config field.
	if (pkgField) {
		const pkg = readPackageJson(cwd)
		if (pkg && pkg[pkgField] !== undefined) {
			found.push(`package.json#${pkgField}`)
		}
	}

	return found
}

export const detectEslintConfigFiles = (cwd: string = process.cwd()): string[] =>
	detectConfigFiles(cwd, ESLINT_CONFIG_FILES, 'eslintConfig')

export const detectPrettierConfigFiles = (cwd: string = process.cwd()): string[] =>
	detectConfigFiles(cwd, PRETTIER_CONFIG_FILES, 'prettier')

/**
 * Remove detected config files to avoid stale configs conflicting with the new one.
 * - Regular files (e.g. ".prettierrc.yaml") → unlinked.
 * - package.json inline fields (e.g. "package.json#prettier") → field deleted from package.json.
 * The package.json is rewritten once per field removal (deduped in practice).
 */
export const removeConfigFiles = (cwd: string, files: string[]): void => {
	for (const file of files) {
		// Handle package.json inline config field: "package.json#prettier"
		if (file.startsWith('package.json#')) {
			const field = file.split('#')[1]
			const pkgPath = join(cwd, 'package.json')
			if (!existsSync(pkgPath)) continue
			try {
				const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
				if (pkg[field] !== undefined) {
					delete pkg[field]
					writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t'), 'utf8')
				}
			} catch {
				// Invalid package.json — skip field removal.
			}
			continue
		}

		const filePath = join(cwd, file)
		if (existsSync(filePath)) {
			unlinkSync(filePath)
		}
	}
}
