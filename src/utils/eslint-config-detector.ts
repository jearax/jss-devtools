/**
 * ESLint Config Detection Utilities
 * Detect existing ESLint configs and versions for smart setup
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'pathe'

export type EslintVersion = '8' | '9' | 'none' | 'unknown'
export type EslintConfigType = 'flat' | 'legacy' | 'mixed' | 'none'

export interface EslintConfigDetection {
	hasConfig: boolean
	configType: EslintConfigType
	version: EslintVersion
	configFiles: string[]
	packageJsonEslint?: {
		version?: string
		hasEslintJs: boolean
		hasEslintConfigNext: boolean
	}
}

/**
 * Detect ESLint version from package.json dependencies
 */
export const detectEslintFromPackageJson = (packageJsonPath: string): EslintConfigDetection['packageJsonEslint'] => {
	try {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
		const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

		const eslintVersion = deps.eslint || deps['eslint-config-next']
		const hasEslintJs = Boolean(deps['@eslint/js'])
		const hasEslintConfigNext = Boolean(deps['eslint-config-next'])

		return {
			version: eslintVersion,
			hasEslintJs,
			hasEslintConfigNext
		}
	} catch (error) {
		return undefined
	}
}

/**
 * Detect ESLint config files in project
 */
export const detectEslintConfigs = (cwd: string): string[] => {
	const configFiles: string[] = []

	// Check for flat config (ESLint 9+)
	const flatConfigs = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs']
	for (const config of flatConfigs) {
		if (existsSync(join(cwd, config))) {
			configFiles.push(config)
		}
	}

	// Check for legacy config (.eslintrc.*)
	const legacyConfigs = ['.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yaml', '.eslintrc.yml']
	for (const config of legacyConfigs) {
		if (existsSync(join(cwd, config))) {
			configFiles.push(config)
		}
	}

	// Check for package.json eslintConfig field
	const packageJsonPath = join(cwd, 'package.json')
	if (existsSync(packageJsonPath)) {
		try {
			const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
			if (packageJson.eslintConfig) {
				configFiles.push('package.json')
			}
		} catch (error) {
			// Invalid package.json, skip
		}
	}

	return configFiles
}

/**
 * Detect ESLint config type from file names
 */
export const detectEslintConfigType = (configFiles: string[]): EslintConfigType => {
	if (configFiles.length === 0) return 'none'

	const hasFlat = configFiles.some((f) => f.startsWith('eslint.config.'))
	const hasLegacy = configFiles.some((f) => f.startsWith('.eslintrc') || f === 'package.json')

	// Both flat and legacy configs present
	if (hasFlat && hasLegacy) return 'mixed'

	// Flat config (ESLint 9+)
	if (hasFlat) return 'flat'

	// Legacy config (.eslintrc.* or package.json)
	if (hasLegacy) return 'legacy'

	return 'none'
}

/**
 * Extract major version from version string
 */
const extractMajorVersion = (version: string): string | null => {
	// Handle semver ranges: ^8.0.0, ~8.0.0, >=8.0.0, 8.x, 8.*
	const match =
		version.match(/[\^~>=]?(\d+)(\.\d+)?(\.\d+)?[x*]?/) ||
		version.match(/(\d+)\.\d+\.?\d*/) ||
		version.match(/^(\d+)\.x/)

	if (match) {
		return match[1] || match[2] || null
	}

	return null
}

/**
 * Detect ESLint version from config and package.json.
 * Priority: package.json version string > config type heuristics.
 * Note: `@eslint/js` is now a peer for BOTH v8 (backport) and v9 editions,
 * so its presence alone no longer implies v8 — the eslint version string wins.
 */
export const detectEslintVersion = (
	configFiles: string[],
	packageJsonEslint?: EslintConfigDetection['packageJsonEslint']
): EslintVersion => {
	// Strongest signal: the actual eslint version pinned in package.json.
	if (packageJsonEslint?.version) {
		const majorVersion = extractMajorVersion(String(packageJsonEslint.version))
		if (majorVersion === '8') return '8'
		if (majorVersion === '9') return '9'
	}

	const configType = detectEslintConfigType(configFiles)

	// Flat config = ESLint 9+ (flat config is the default in v9). @eslint/js is a
	// peer for both editions, so it no longer disqualifies v9.
	if (configType === 'flat') return '9'

	// Legacy config (.eslintrc.*) only runs on ESLint 8.x (v9 dropped it).
	if (configType === 'legacy') return '8'

	// Mixed config - flat (9.x) takes priority since legacy is ignored by v9.
	if (configType === 'mixed') return '9'

	// Next.js' own eslint-config-next historically pins ESLint 8; recent
	// releases (v15+) ship flat config for v9, but absent a version string we
	// conservatively assume v8 for the legacy setup.
	if (packageJsonEslint?.hasEslintConfigNext) return '8'

	return 'unknown'
}

/**
 * Main detection function
 */
export const detectEslintConfig = (cwd: string): EslintConfigDetection => {
	const packageJsonPath = join(cwd, 'package.json')
	const packageJsonEslint = existsSync(packageJsonPath) ? detectEslintFromPackageJson(packageJsonPath) : undefined

	const configFiles = detectEslintConfigs(cwd)
	const version = detectEslintVersion(configFiles, packageJsonEslint)
	const configType = detectEslintConfigType(configFiles)

	return {
		hasConfig: configFiles.length > 0,
		configType,
		version,
		configFiles,
		packageJsonEslint
	}
}
