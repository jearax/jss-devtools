import { confirm, group, select } from '@clack/prompts'
import { defineCommand } from 'citty'
import { join } from 'pathe'

import { Framework, SetupAnswers } from '@/commands/init/types/setup-pkgs'
import { setupAliasImport } from '@/commands/init/utils/setup-alias-import'
import { setupFormatter } from '@/commands/init/utils/setup-formatter'
import { setupHusky } from '@/commands/init/utils/setup-husky'
import { buildInstallPlan, executeInstall, getIntendedRanges, buildPkgRange } from '@/commands/init/utils/setup-pkgs'
import { displayBanner } from '@/utils/banner'
import { logger } from '@/utils/logger'
import { detectPackageManager } from '@/utils/package-manager-detector'
import { detectRepoState } from '@/utils/repo-detector'
import { confirmInstallation, saveToPackageJson, confirmLinterCoexistence, resolvePackageConflicts } from '@/utils/install-confirm'
import { detectPackageConflicts } from '@/utils/conflict-detector'

// Valid framework options
const VALID_FRAMEWORKS: Framework[] = ['node', 'react', 'react-native', 'nextjs']

// Default configuration for non-interactive mode
const DEFAULT_CONFIG = {
	framework: 'node' as Framework,
	tailwind: true,
	storybook: false,
	aliasImport: true
}

const validateFramework = (value: string | undefined): Framework => {
	if (!value) {
		return DEFAULT_CONFIG.framework
	}

	if (!VALID_FRAMEWORKS.includes(value as Framework)) {
		throw new Error(`Invalid framework '${value}'. Must be: ${VALID_FRAMEWORKS.join(', ')}`)
	}

	return value as Framework
}

const resolveAnswers = (args: Record<string, unknown>): SetupAnswers => {
	const framework = validateFramework(args.framework as string | undefined)
	const isNonNodeFramework = framework !== 'node'

	return {
		framework,
		useTailwind: Boolean(isNonNodeFramework && (args.tailwind ?? DEFAULT_CONFIG.tailwind)),
		useStorybook: Boolean(isNonNodeFramework && (args.storybook ?? DEFAULT_CONFIG.storybook)),
		useAliasImport: Boolean(args.aliasImport ?? DEFAULT_CONFIG.aliasImport)
	}
}

export const initCommand = defineCommand({
	meta: {
		name: 'init',
		description: 'Initialize a new project'
	},
	args: {
		yes: {
			type: 'boolean',
			alias: 'y',
			description: 'Use default configuration (non-interactive)'
		},
		framework: {
			type: 'string',
			description: 'Target framework (node|react|react-native|nextjs)'
		},
		tailwind: {
			type: 'boolean',
			description: 'Enable Tailwind CSS'
		},
		storybook: {
			type: 'boolean',
			description: 'Enable Storybook'
		},
		aliasImport: {
			type: 'boolean',
			description: 'Enable alias imports'
		}
	},
	run: async ({ args }) => {
		displayBanner()

		const pm = await detectPackageManager()

		if (!pm) {
			throw new Error('No package manager detected.')
		}

		// Detect non-interactive mode: any flag triggers it
		const isNonInteractive =
			args.yes ||
			args.framework !== undefined ||
			args.tailwind !== undefined ||
			args.storybook !== undefined ||
			args.aliasImport !== undefined

		let answers: SetupAnswers

		if (isNonInteractive) {
			answers = resolveAnswers(args)
		} else {
			// Interactive mode via clack prompts
			const rawAnswers = await group(
				{
					framework: () =>
						select({
							message: 'Which framework do you want to use?',
							initialValue: 'node',
							options: [
								{
									value: 'node',
									label: 'Node.js'
								},
								{
									value: 'react',
									label: 'React'
								},
								{
									value: 'react-native',
									label: 'React Native'
								},
								{
									value: 'nextjs',
									label: 'Next.js'
								}
							]
						}),

					useTailwind: ({ results }) => {
						if (results.framework && ['react', 'react-native', 'nextjs'].includes(results.framework)) {
							return confirm({
								message: 'Do you want to use Tailwind CSS?'
							})
						}
					},

					useStorybook: ({ results }) => {
						if (results.framework && ['react', 'react-native', 'nextjs'].includes(results.framework)) {
							return confirm({
								initialValue: false,
								message: 'Do you want to use Storybook?'
							})
						}
					},

					useAliasImport: () =>
						confirm({
							message: 'Do you want to use alias import?'
						})
				},
				{
					onCancel: () => {
						logger.warn('Setup cancelled!')
						process.exit(1)
					}
				}
			)

			answers = {
				framework: rawAnswers.framework as Framework,
				useTailwind: rawAnswers.useTailwind === true,
				useStorybook: rawAnswers.useStorybook === true,
				useAliasImport: rawAnswers.useAliasImport === true
			}
		}

		// Ensure package.json exists before installing dependencies
		const { existsSync, writeFileSync } = await import('node:fs')
		const packageJsonPath = join(process.cwd(), 'package.json')
		if (!existsSync(packageJsonPath)) {
			logger.info('Creating package.json...')
			const projectName = process.cwd().split('/').pop() || 'my-project'
			const defaultPackageJson = {
				name: projectName,
				version: '1.0.0',
				description: '',
				main: 'index.js',
				scripts: {
					test: 'echo "Error: no test specified" && exit 1'
				},
				keywords: [],
				author: '',
				license: 'ISC'
			}
			writeFileSync(packageJsonPath, JSON.stringify(defaultPackageJson, null, 2))
			logger.success('Created package.json')
		}

		// === ENHANCED DETECTION & CONFIRMATION FLOW ===

		// 1. Detect repo state (with linter info)
		const repoState = detectRepoState()

		// 2. Check linter coexistence
		const linterOk = await confirmLinterCoexistence(repoState.linter, {
			nonInteractive: isNonInteractive
		})

		if (!linterOk) {
			logger.warn('Setup cancelled. No changes made.')
			return
		}

		// 3. Detect and resolve package conflicts BEFORE building the plan.
		//    Conflict detection must use the FULL intended package list (what
		//    jss-devtools would install if nothing were present), because
		//    buildInstallPlan otherwise skips already-installed packages and the
		//    conflict would be invisible.
		const intendedRanges = getIntendedRanges(answers)
		const conflicts = detectPackageConflicts(repoState.packageVersions, intendedRanges)

		// Resolve the actual planned versions (x.y.z) for incompatible conflicts
		// so the warning shows real versions, not the peerDep major.0.0 range.
		// Only incompatible ones need it (compatible are silently skipped).
		await Promise.all(
			conflicts.filter((c) => !c.isCompatible).map(async (c) => {
				c.plannedVersion = await buildPkgRange(c.name)
			})
		)

		const conflictResolution = await resolvePackageConflicts(conflicts, {
			nonInteractive: isNonInteractive
		})

		if (!conflictResolution.proceed) {
			logger.warn('Setup cancelled. No changes made.')
			return
		}

		// 4. Build install plan, overwriting packages the user opted to update.
		const plan = await buildInstallPlan(answers, repoState, conflictResolution.overwrite)

		// 5. Confirm installation mode
		const selection = await confirmInstallation(plan, {
			nonInteractive: isNonInteractive
		})

		if (selection === 'cancel') {
			logger.warn('Setup cancelled. No changes made.')
			return
		}

		// 6. Execute install or save
		const isSaveOnly = selection === 'save-only'
		if (isSaveOnly) {
			saveToPackageJson(plan)
		} else if (plan.toInstall.length > 0) {
			try {
				await executeInstall(plan, pm)
			} catch (error) {
				// Install failed (offline / package manager error) — abort cleanly
				// instead of crashing, since later steps assume deps are present.
				logger.error('Failed to install dependencies. Check your network or package manager.')
				if (error instanceof Error) logger.error(error.message)
				return
			}
		}

		// Formatter runs first (sequential): it may prompt for existing configs
		// and can cancel the whole setup. Husky + alias run in parallel after.
		const formatterResult = await setupFormatter({
			pm,
			answers,
			nonInteractive: isNonInteractive
		})

		if (formatterResult === 'cancel') {
			logger.warn('Setup cancelled during config handling. No further changes made.')
			return
		}

		// Husky + alias run in parallel. Husky is always set up (even in save-only
		// mode) — `npx husky init` resolves the binary on demand.
		await Promise.all([
			setupHusky({ pm }),
			setupAliasImport({
				answers,
				nonInteractive: isNonInteractive
			})
		])

		logger.success('Setup completed!')
	}
})
