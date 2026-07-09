/**
 * Linter Detection Utilities
 * Detects ESLint, Biome, Oxlint from package.json and config files
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'pathe'

export type LinterType = 'eslint' | 'biome' | 'oxlint' | 'none' | 'mixed'

export interface LinterState {
	type: LinterType
	version?: string
	configFiles: string[]
	hasConflict: boolean // True if linter khác với jss-devtools setup
	packages: string[] // Package names đã cài đặt
}

/**
 * Detect linter type từ package.json dependencies
 */
export const detectLinterType = (deps: Record<string, string>): LinterType => {
	const hasEslint = Boolean(deps.eslint)
	const hasBiome = Boolean(deps['@biomejs/biome'])
	const hasOxlint = Boolean(deps.oxlint)

	if (hasEslint && !hasBiome && !hasOxlint) return 'eslint'
	if (hasBiome && !hasEslint && !hasOxlint) return 'biome'
	if (hasOxlint && !hasEslint && !hasBiome) return 'oxlint'
	if ([hasEslint, hasBiome, hasOxlint].filter(Boolean).length > 1) return 'mixed'

	return 'none'
}

/**
 * Extract linter version từ package.json
 */
export const extractLinterVersion = (deps: Record<string, string>, linterType: LinterType): string | undefined => {
	const pkgMap: Record<LinterType, string[]> = {
		eslint: ['eslint'],
		biome: ['@biomejs/biome'],
		oxlint: ['oxlint'],
		none: [],
		mixed: ['eslint', '@biomejs/biome', 'oxlint']
	}

	const names = pkgMap[linterType] || []
	for (const name of names) {
		if (deps[name]) return deps[name]
	}

	return undefined
}

/**
 * Detect linter config files
 */
export const detectLinterConfigs = (cwd: string, linterType: LinterType): string[] => {
	const configs: string[] = []

	if (linterType === 'eslint' || linterType === 'mixed') {
		const eslintConfigs = [
			'eslint.config.js',
			'eslint.config.mjs',
			'eslint.config.cjs',
			'.eslintrc.js',
			'.eslintrc.cjs',
			'.eslintrc.json',
			'.eslintrc.yaml',
			'.eslintrc.yml',
			'.eslintrc'
		]
		for (const config of eslintConfigs) {
			if (existsSync(join(cwd, config))) configs.push(config)
		}
	}

	if (linterType === 'biome' || linterType === 'mixed') {
		if (existsSync(join(cwd, 'biome.json'))) configs.push('biome.json')
		if (existsSync(join(cwd, 'biome.jsonc'))) configs.push('biome.jsonc')
	}

	if (linterType === 'oxlint' || linterType === 'mixed') {
		if (existsSync(join(cwd, 'oxlint.json'))) configs.push('oxlint.json')
	}

	return configs
}

/**
 * Main linter detection function
 */
export const detectLinter = (cwd: string): LinterState => {
	const pkgPath = join(cwd, 'package.json')

	if (!existsSync(pkgPath)) {
		return {
			type: 'none',
			configFiles: [],
			hasConflict: false,
			packages: []
		}
	}

	try {
		const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
		const deps = { ...pkg.dependencies, ...pkg.devDependencies }

		const type = detectLinterType(deps)
		const version = extractLinterVersion(deps, type)
		const configFiles = detectLinterConfigs(cwd, type)

		// Detect conflict: có linter khác với jss-devtools setup (ESLint 8.x)
		const hasConflict = type !== 'none' && type !== 'eslint'

		// Get package names
		const packages: string[] = []
		if (deps.eslint) packages.push('eslint')
		if (deps['@biomejs/biome']) packages.push('@biomejs/biome')
		if (deps.oxlint) packages.push('oxlint')

		return {
			type,
			version,
			configFiles,
			hasConflict,
			packages
		}
	} catch {
		return {
			type: 'none',
			configFiles: [],
			hasConflict: false,
			packages: []
		}
	}
}
