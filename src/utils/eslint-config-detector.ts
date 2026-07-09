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
 * Detect ESLint version from config and package.json
 */
export const detectEslintVersion = (
	configFiles: string[],
	packageJsonEslint?: EslintConfigDetection['packageJsonEslint']
): EslintVersion => {
	// Detect from config type
	const configType = detectEslintConfigType(configFiles)

	// Flat config = ESLint 9+ (unless has @eslint/js which indicates v8 backport)
	if (configType === 'flat' && !packageJsonEslint?.hasEslintJs) return '9'

	// Legacy config with @eslint/js = ESLint 8 (backport)
	if (configType === 'legacy' && packageJsonEslint?.hasEslintJs) return '8'

	// Mixed config - prioritize flat (9.x) unless has @eslint/js (8.x backport)
	if (configType === 'mixed') {
		return packageJsonEslint?.hasEslintJs ? '8' : '9'
	}

	// Detect from package.json version string
	if (packageJsonEslint?.version) {
		const majorVersion = extractMajorVersion(String(packageJsonEslint.version))
		if (majorVersion === '8') return '8'
		if (majorVersion === '9') return '9'
	}

	// Next.js ESLint config typically uses ESLint 8
	if (packageJsonEslint?.hasEslintConfigNext) return '8'

	// Legacy config (.eslintrc.*) without @eslint/js - default to ESLint 8
	if (configType === 'legacy') return '8'

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
