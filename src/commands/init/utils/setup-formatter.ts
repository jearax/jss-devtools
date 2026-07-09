import { existsSync, readFileSync, writeFileSync } from 'fs'
import { PackageManager } from 'nypm'
import { join } from 'pathe'

import { SetupAnswers } from '@/commands/init/types/setup-pkgs'
import { getPMExecCommand } from '@/commands/init/utils/pm'
import { logger } from '@/utils/logger'
import { detectEslintConfig } from '@/utils/eslint-config-detector'
import { detectEslintConfigFiles, detectPrettierConfigFiles, removeConfigFiles } from '@/utils/config-detector'
import { promptConfigAction } from '@/utils/install-confirm'
import {
	generateNodeEslintConfig,
	generateReactEslintConfig,
	generateNextEslintConfig
} from '@/utils/eslint-config-generator'

/** Setup result: 'continue' lets caller proceed; 'cancel' aborts the whole setup. */
export type FormatterSetupResult = 'continue' | 'cancel'

/** The config file jss-devtools generates. */
const TARGET_PRETTIER_FILE = '.prettierrc.json'
const TARGET_ESLINT_FILE = 'eslint.config.mjs'

interface FormatterOptions {
	pm: PackageManager
	answers: SetupAnswers
	/** Non-interactive (-y): auto-replace existing configs. */
	nonInteractive: boolean
}

const PRETTIER_BASE_CONFIG = {
	useTabs: true,
	tabWidth: 2,
	printWidth: 120,
	semi: false,
	singleQuote: true,
	jsxSingleQuote: false,
	arrowParens: 'always',
	trailingComma: 'none',
	endOfLine: 'auto',
	plugins: [] as string[]
}

/** Resolve the ESLint template for the chosen framework. */
const getEslintTemplate = (answers: SetupAnswers): string => {
	switch (answers.framework) {
		case 'react':
		case 'react-native':
			return generateReactEslintConfig({
				framework: answers.framework,
				useTailwind: answers.useTailwind,
				useStorybook: answers.useStorybook
			})
		case 'nextjs':
			return generateNextEslintConfig({
				framework: answers.framework,
				useTailwind: answers.useTailwind
			})
		case 'node':
		default:
			return generateNodeEslintConfig()
	}
}

export const setupFormatter = async ({
	pm,
	answers,
	nonInteractive
}: FormatterOptions): Promise<FormatterSetupResult> => {
	// ── Prettier ────────────────────────────────────────────────────────────
	const prettierConfig = { ...PRETTIER_BASE_CONFIG }
	if (answers.useTailwind) {
		prettierConfig.plugins.push('prettier-plugin-tailwindcss')
	}

	const foundPrettier = detectPrettierConfigFiles()
	if (foundPrettier.length > 0) {
		// Fast path: existing config is already the target format → silently
		// overwrite it. No prompt needed (same file, no stale-format conflict).
		if (foundPrettier.every((f) => f === TARGET_PRETTIER_FILE)) {
			writePrettierConfig(prettierConfig)
		} else {
			const action = await promptConfigAction('Prettier', foundPrettier, { nonInteractive })
			if (action === 'cancel') return 'cancel'
			if (action === 'keep') {
				// Keep: never overwrite user's file. Only generate our file if a
				// same-name one doesn't already exist (else just keep theirs).
				if (foundPrettier.includes(TARGET_PRETTIER_FILE)) {
					logger.info(`Keeping your existing ${TARGET_PRETTIER_FILE}. Skipped generation.`)
				} else {
					logger.info(`Keeping your existing config(s): ${foundPrettier.join(', ')}`)
					writePrettierConfig(prettierConfig)
				}
			} else {
				// Replace: remove all detected configs first to avoid stale-file conflicts.
				removeConfigFiles(process.cwd(), foundPrettier)
				writePrettierConfig(prettierConfig)
			}
		}
	} else {
		// No existing config → auto-create without asking.
		writePrettierConfig(prettierConfig)
	}

	// ── ESLint ──────────────────────────────────────────────────────────────
	// Guard: ESLint 9.x is unsupported by v1.x — always skip regardless of prompt.
	const eslintDetection = detectEslintConfig(process.cwd())
	if (eslintDetection.hasConfig && eslintDetection.version === '9') {
		logger.warn('Detected ESLint 9.x config. @jearax/jss-devtools v1.x supports ESLint 8.x only.')
		logger.warn('Please upgrade to v2.x for ESLint 9.x support or downgrade to ESLint 8.x.')
		logger.info('Skipping ESLint config generation...')
	} else {
		const foundEslint = detectEslintConfigFiles()
		if (foundEslint.length > 0) {
			// Fast path: existing config is already the target format → silently
			// overwrite it. No prompt needed (same file, no stale-format conflict).
			if (foundEslint.every((f) => f === TARGET_ESLINT_FILE)) {
				writeEslintConfig(getEslintTemplate(answers))
			} else {
				const action = await promptConfigAction('ESLint', foundEslint, { nonInteractive })
				if (action === 'cancel') return 'cancel'
				if (action === 'keep') {
					// Keep: never overwrite user's file. Only generate our file if a
					// same-name one doesn't already exist (else just keep theirs).
					if (foundEslint.includes(TARGET_ESLINT_FILE)) {
						logger.info(`Keeping your existing ${TARGET_ESLINT_FILE}. Skipped generation.`)
					} else {
						logger.info(`Keeping your existing config(s): ${foundEslint.join(', ')}`)
						writeEslintConfig(getEslintTemplate(answers))
					}
				} else {
					// Replace: remove all detected configs first to avoid stale-file conflicts.
					removeConfigFiles(process.cwd(), foundEslint)
					writeEslintConfig(getEslintTemplate(answers))
				}
			}
		} else {
			// No existing config → auto-generate without asking.
			writeEslintConfig(getEslintTemplate(answers))
		}
	}

	// ── package.json scripts + lint-staged ──────────────────────────────────
	updatePackageJsonScripts(pm)

	return 'continue'
}

/** Write the Prettier config to .prettierrc.json. Idempotent: only writes +
 * logs when content actually changes. Silent on 2nd run if unchanged. */
const writePrettierConfig = (config: typeof PRETTIER_BASE_CONFIG): void => {
	const prettierrcPath = join(process.cwd(), '.prettierrc.json')
	const content = JSON.stringify(config, null, '\t')
	const existed = existsSync(prettierrcPath)

	if (existed && readFileSync(prettierrcPath, 'utf8') === content) return // unchanged

	try {
		writeFileSync(prettierrcPath, content, 'utf8')
		logger.success(`${existed ? 'Updated' : 'Created'} .prettierrc.json`)
	} catch (error) {
		logger.error('Failed to update .prettierrc.json')
		if (error instanceof Error) logger.error(error.message)
	}
}

/** Write the ESLint flat config to eslint.config.mjs. Idempotent: only writes +
 * logs when content actually changes. */
const writeEslintConfig = (template: string): void => {
	const eslintConfigPath = join(process.cwd(), 'eslint.config.mjs')
	const existed = existsSync(eslintConfigPath)

	if (existed && readFileSync(eslintConfigPath, 'utf8') === template) return // unchanged

	writeFileSync(eslintConfigPath, template, 'utf8')
	logger.success(`${existed ? 'Updated' : 'Created'} eslint.config.mjs`)
}

/** Merge format script + lint-staged config into package.json. Idempotent:
 * only writes + logs when something actually changes. */
const updatePackageJsonScripts = (pm: PackageManager): void => {
	const packageJsonPath = join(process.cwd(), 'package.json')
	if (!existsSync(packageJsonPath)) return

	// Format script + lint-staged cover the common Node.js source dirs parallel
	// to `src`. The brace glob only matches dirs that actually exist.
	const FORMAT_GLOB = '{src,test,tests,lib,libs,script,scripts}/**/*.{js,ts,jsx,tsx}'
	const FORMAT_SCRIPT = `eslint --fix "${FORMAT_GLOB}" && prettier --write "${FORMAT_GLOB}"`
	const LINT_STAGED_SRC = ['eslint --fix', 'prettier --write']
	const LINT_STAGED_PKG = [`${getPMExecCommand(pm)} prettier-package-json --write`]

	try {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
		if (!packageJson.scripts) packageJson.scripts = {}
		if (!packageJson['lint-staged']) packageJson['lint-staged'] = {}

		const LINT_STAGED_KEY = FORMAT_GLOB
		// Track whether anything actually changes.
		let changed = false
		if (packageJson.scripts.format !== FORMAT_SCRIPT) {
			packageJson.scripts.format = FORMAT_SCRIPT
			changed = true
		}
		// Migrate any stale single-dir key from older jss-devtools versions.
		if (packageJson['lint-staged']['src/**/*.{js,ts,jsx,tsx}'] !== undefined) {
			delete packageJson['lint-staged']['src/**/*.{js,ts,jsx,tsx}']
			changed = true
		}
		if (JSON.stringify(packageJson['lint-staged'][LINT_STAGED_KEY]) !== JSON.stringify(LINT_STAGED_SRC)) {
			packageJson['lint-staged'][LINT_STAGED_KEY] = LINT_STAGED_SRC
			changed = true
		}
		if (JSON.stringify(packageJson['lint-staged']['package.json']) !== JSON.stringify(LINT_STAGED_PKG)) {
			packageJson['lint-staged']['package.json'] = LINT_STAGED_PKG
			changed = true
		}

		if (!changed) return // already configured, leave untouched + silent

		writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, '\t'))
		logger.success('Updated package.json with scripts and lint-staged config')
	} catch (error) {
		logger.error('Could not update package.json')
		if (error instanceof Error) logger.error(error.message)
	}
}
