import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'pathe'
import { select, text } from '@clack/prompts'

import { logger } from '@/utils/logger'
import { SetupAnswers } from '@/commands/init/types/setup-pkgs'

export const setupAliasImport = async ({
	answers,
	nonInteractive
}: {
	answers: SetupAnswers
	nonInteractive: boolean
}) => {
	if (!answers.useAliasImport) {
		return
	}

	const tsconfigPath = join(process.cwd(), 'tsconfig.json')

	// No tsconfig.json → create a minimal one with the @/* alias. Modern TS
	// (5.x+) resolves `paths` relative to the tsconfig.json directory, so no
	// `baseUrl` is needed — and baseUrl is deprecated (warns now, removed in TS 7).
	if (!existsSync(tsconfigPath)) {
		const minimalTsconfig = {
			compilerOptions: {
				target: 'ES2022',
				module: 'ESNext',
				moduleResolution: 'bundler',
				strict: true,
				esModuleInterop: true,
				skipLibCheck: true,
				paths: { '@/*': ['./src/*'] }
			},
			include: ['src/**/*'],
			exclude: ['node_modules']
		}
		writeFileSync(tsconfigPath, JSON.stringify(minimalTsconfig, null, '\t'), 'utf8')
		logger.success('Created tsconfig.json')
	}

	try {
		const tsconfigContent = readFileSync(tsconfigPath, 'utf8')
		const tsconfig = JSON.parse(tsconfigContent)

		// Initialize compilerOptions if it doesn't exist
		if (!tsconfig.compilerOptions) {
			tsconfig.compilerOptions = {}
		}

		// Detect existing alias patterns
		const existingPaths = tsconfig.compilerOptions.paths || {}
		const existingAliases = Object.keys(existingPaths).filter((key) => key.includes('*') && !key.startsWith('@types/'))

		// Default alias jss-devtools manages: "@/*". Modern setups resolve via
		// "./src/*" (tsconfig-relative, no baseUrl); legacy baseUrl ones use "./*".
		const aliasValues = Array.isArray(existingPaths['@/*']) ? existingPaths['@/*'] : []
		const hasDefaultAlias = aliasValues.includes('./*') || aliasValues.includes('./src/*')

		let aliasChar = '@'

		// If the default alias is already configured, force-process silently
		// (no prompt, no log) — the merge below is idempotent. Only prompt when
		// OTHER alias patterns exist that need a user decision.
		if (existingAliases.length > 0 && !hasDefaultAlias && !nonInteractive) {
			logger.info(`Detected existing aliases: ${existingAliases.join(', ')}`)

			const action = await select({
				message: 'Existing alias patterns found. What to do?',
				options: [
					{ value: 'replace', label: 'Replace with new alias' },
					{ value: 'keep', label: 'Keep existing aliases' },
					{ value: 'cancel', label: 'Cancel alias setup' }
				]
			})

			if (typeof action !== 'string' || action === 'cancel') {
				logger.warn('Alias import setup cancelled.')
				return
			}

			if (action === 'keep') {
				logger.info('Keeping existing aliases. Skipping alias import setup.')
				return
			}

			// If replace, ask for alias character
			const aliasInput = await text({
				message: 'Enter alias character (default: @)',
				initialValue: '@',
				validate: (value) => {
					if (typeof value !== 'string' || !value || value.length !== 1) {
						return 'Please enter a single character'
					}
					return undefined
				}
			})

			if (typeof aliasInput === 'string') {
				aliasChar = aliasInput
				logger.info(`Using alias character: ${aliasChar}`)
			}
		}

		// Compute the alias path. `paths` resolve relative to:
		//  - the consumer's existing `baseUrl` dir if they set one (legacy)
		//  - the tsconfig.json dir otherwise (modern, no baseUrl needed)
		// Never add baseUrl ourselves — it's deprecated (TS 5.x warning, TS 7 removal).
		const existingBaseUrl = tsconfig.compilerOptions.baseUrl
		const aliasTarget = existingBaseUrl ? './*' : './src/*'
		const targetPaths = {
			...existingPaths, // Keep existing paths
			[`${aliasChar}/*`]: [aliasTarget] // Add new alias
		}

		const unchanged = JSON.stringify(existingPaths) === JSON.stringify(targetPaths)

		if (unchanged) {
			return
		}

		tsconfig.compilerOptions.paths = targetPaths

		// Write back to file with proper formatting
		writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, '\t'), 'utf8')
		logger.success(`Updated tsconfig.json with alias imports (${aliasChar}/*)`)
	} catch (error) {
		logger.error('Failed to update tsconfig.json')

		if (error instanceof Error) {
			logger.error(error.message)
		}
	}
}
