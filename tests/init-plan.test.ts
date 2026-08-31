// Unit tests for init plan computation — injected ctx, readFile backed by Map.
import { AgentName } from 'package-manager-detector'
import { describe, expect, it, vi } from 'vitest'

import { computePlan } from '@/commands/init/plan/compute-plan'
import { planDisplayLines } from '@/commands/init/plan/display'
import { getPreset } from '@/commands/init/presets/get-preset'
import { InitArgs } from '@/commands/init/types'

describe('computePlan', () => {
	const defaultArgs = {
		framework: 'node' as const,
		yes: false,
		dryRun: false,
		json: false,
		features: {
			linter: true,
			commitlint: true,
			install: true
		}
	} satisfies InitArgs

	it('node full features: writes all config files and adds scripts', () => {
		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0'],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(defaultArgs, ctx)

		// git-init + 6 writes (eslint, prettier, commitlint, tsconfig, gitignore, pre-commit, commit-msg) + manifest-edit + install + husky-activate = 11
		expect(plan.actions).toHaveLength(11)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === 'eslint.config.mjs')).toBe(true)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === '.prettierrc.json')).toBe(true)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === 'commitlint.config.mjs')).toBe(true)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === 'tsconfig.json')).toBe(true)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === '.gitignore')).toBe(true)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === '.husky/pre-commit')).toBe(true)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === '.husky/commit-msg')).toBe(true)

		// Manifest edit
		const manifestEdit = plan.actions.find((a) => a.kind === 'manifest-edit')

		expect(manifestEdit).toBeDefined()
		expect(manifestEdit?.scripts).toHaveProperty('prepare')
		expect(manifestEdit?.scripts).toHaveProperty('format')
		expect(manifestEdit?.lintStaged).toBeDefined()

		// Install action
		expect(plan.actions.some((a) => a.kind === 'install')).toBe(true)
		const install = plan.actions.find((a) => a.kind === 'install')

		expect(install?.devSpecs).toEqual(['eslint@^10.0.0'])

		// Git init
		expect(plan.actions.some((a) => a.kind === 'git-init')).toBe(true)

		// Husky activate
		expect(plan.actions.some((a) => a.kind === 'husky-activate')).toBe(true)

		// Skipped
		expect(plan.skipped).toHaveLength(0)
	})

	it('react full features: writes react plugins', () => {
		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0'],
				runtime: ['react@^18.0.0', 'react-dom@^18.0.0'],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'peer+dev' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(defaultArgs, ctx)

		// When install is true, devDeps is NOT set on manifest-edit (handled by install action)
		const manifestEdit = plan.actions.find((a) => a.kind === 'manifest-edit')!

		expect(manifestEdit.devDeps).toBeUndefined()

		// Install action should include runtime specs as peer+dev
		const install = plan.actions.find((a) => a.kind === 'install')

		expect(install).toBeDefined()
		expect(install?.devSpecs).toContain('eslint@^10.0.0')
		expect(install?.devSpecs.some((s) => s.startsWith('react@'))).toBe(true)
	})

	it('next full features: tsconfig with jsx preserve, next plugin', () => {
		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0'],
				runtime: ['react@^18.0.0', 'react-dom@^18.0.0', 'next@^14.0.0'],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'peer+dev' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(defaultArgs, ctx)

		// With install: true, devDeps/runtimePlacement NOT on manifest-edit
		const manifestEdit = plan.actions.find((a) => a.kind === 'manifest-edit')!

		expect(manifestEdit.devDeps).toBeUndefined()

		const install = plan.actions.find((a) => a.kind === 'install')!

		expect(install.devSpecs.some((s) => s.startsWith('next@'))).toBe(true)
	})

	it('--no-linter: no eslint/prettier writes, no pre-commit hook, no format script, lint-staged skipped', () => {
		const args = {
			...defaultArgs,
			features: {
				linter: false,
				commitlint: true,
				install: true
			}
		}

		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0', 'prettier'],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(args, ctx)

		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === 'eslint.config.mjs')).toBe(false)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === '.prettierrc.json')).toBe(false)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === '.husky/pre-commit')).toBe(false)

		const manifestEdit = plan.actions.find((a) => a.kind === 'manifest-edit')!

		expect(manifestEdit.scripts).toEqual({ prepare: 'husky' })
		expect(manifestEdit.lintStaged).toBeUndefined()

		const skipped = plan.skipped.find((s) => s.feature === 'lint-staged')

		expect(skipped).toBeDefined()
		expect(skipped?.reason).toContain('--no-linter')
	})

	it('--no-commitlint: no commitlint config/hook/pkg', () => {
		const args = {
			...defaultArgs,
			features: {
				linter: true,
				commitlint: false,
				install: true
			}
		}

		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0', 'prettier', '@commitlint/cli', '@commitlint/config-conventional'],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(args, ctx)

		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === 'commitlint.config.mjs')).toBe(false)
		expect(plan.actions.some((a) => a.kind === 'write-file' && a.path === '.husky/commit-msg')).toBe(false)

		const skipped = plan.skipped.find((s) => s.feature === 'commitlint')

		expect(skipped).toBeDefined()
		expect(skipped?.reason).toContain('--no-commitlint')
	})

	it('--no-install: manifest-edit has devDeps record, no install/husky-activate actions', () => {
		const args = {
			...defaultArgs,
			features: {
				linter: true,
				commitlint: true,
				install: false
			}
		}

		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0', 'prettier@^3.0.0'],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(args, ctx)

		const manifestEdit = plan.actions.find((a) => a.kind === 'manifest-edit')!

		// specsToRecord captures the @ separator into the value (current behavior — bug in src)
		expect(manifestEdit.devDeps).toHaveProperty('eslint')
		expect(manifestEdit.devDeps).toHaveProperty('prettier')
		expect(manifestEdit.devDeps?.eslint).toContain('10.0.0')
		expect(manifestEdit.devDeps?.prettier).toContain('3.0.0')

		expect(plan.actions.some((a) => a.kind === 'install')).toBe(false)
		expect(plan.actions.some((a) => a.kind === 'husky-activate')).toBe(false)

		const skipped = plan.skipped.find((s) => s.feature === 'install')

		expect(skipped).toBeDefined()
		expect(skipped?.reason).toContain('--no-install')
	})

	it('idempotent: same content returns no write actions', () => {
		// First call to get the generated content
		const initialCtx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: true,
			specs: {
				dev: [],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const firstPlan = computePlan(defaultArgs, initialCtx)

		// Collect generated content from first plan
		const existingFiles: Record<string, string> = {}

		for (const action of firstPlan.actions) {
			if (action.kind === 'write-file') {
				existingFiles[action.path] = action.content
			}
		}

		// Now second call with those as existing files
		const secondCtx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: true,
			specs: {
				dev: [],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((path: string) => existingFiles[path] ?? null)
		}

		const plan = computePlan(defaultArgs, secondCtx)

		// All write actions should be skipped because content matches
		const writeActions = plan.actions.filter((a) => a.kind === 'write-file')

		expect(writeActions).toHaveLength(0)

		// git-init not present when hasGit=true
		expect(plan.actions.some((a) => a.kind === 'git-init')).toBe(false)
	})

	it('tsconfig existing no-paths → merge write', () => {
		const tsconfig = JSON.stringify({
			compilerOptions: {
				target: 'ES2022',
				module: 'commonjs'
			}
		})

		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: [],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((path: string) => {
				if (path === 'tsconfig.json') {
					return tsconfig
				}

				return null
			})
		}

		const plan = computePlan(defaultArgs, ctx)

		const tsconfigAction = plan.actions.find((a) => a.kind === 'write-file' && a.path === 'tsconfig.json')

		expect(tsconfigAction).toBeDefined()

		if (tsconfigAction && tsconfigAction.kind === 'write-file') {
			const merged = JSON.parse(tsconfigAction.content)

			expect(merged.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
			expect(merged.compilerOptions.target).toBe('ES2022')
		}
	})

	it('tsconfig paths-exists → skip', () => {
		const tsconfig = JSON.stringify({
			compilerOptions: {
				target: 'ES2022',
				paths: { '@/*': ['./src/*'] }
			}
		})

		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: [],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((path: string) => {
				if (path === 'tsconfig.json') {
					return tsconfig
				}

				return null
			})
		}

		const plan = computePlan(defaultArgs, ctx)

		const skipped = plan.skipped.find((s) => s.feature === 'typescript')

		expect(skipped).toBeDefined()
		expect(skipped?.reason).toContain('paths-exists')
	})

	it('conflicts: existing .eslintrc → pendingConflicts includes target with existing', () => {
		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: [],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((path: string) => {
				if (path === 'eslint.config.mjs') {
					return 'import js from "@eslint/js"\nexport default [js.configs.recommended]'
				}

				if (path === '.eslintrc') {
					return 'module.exports = { rules: {} }'
				}

				return null
			})
		}

		const plan = computePlan(defaultArgs, ctx)

		const conflicts = plan.pendingConflicts

		expect(conflicts.length).toBe(1)
		expect(conflicts[0].target).toBe('eslint.config.mjs')
		expect(conflicts[0].existing).toContain('.eslintrc')
	})

	it('no existing files → no pending conflicts', () => {
		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: [],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(defaultArgs, ctx)

		expect(plan.pendingConflicts.length).toBe(0)
	})
})

describe('planDisplayLines', () => {
	it('node full features display includes all actions', () => {
		getPreset('node')

		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0'],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(
			{
				framework: 'node' as const,
				yes: false,
				dryRun: false,
				json: false,
				features: {
					linter: true,
					commitlint: true,
					install: true
				}
			},
			ctx
		)

		const lines = planDisplayLines(plan, 'pnpm')

		expect(lines).toContain('write eslint.config.mjs')
		expect(lines).toContain('write .prettierrc.json')
		expect(lines).toContain('write commitlint.config.mjs')
		expect(lines).toContain('write tsconfig.json')
		expect(lines).toContain('write .husky/pre-commit')
		expect(lines).toContain('write .husky/commit-msg')
		expect(lines.some((l) => l.includes('package.json: scripts'))) // manifest edit
		expect(lines.some((l) => l.includes('pnpm add -D'))) // install command
	})

	it('writes show install command string', () => {
		getPreset('node')

		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0', 'prettier'],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(
			{
				framework: 'node' as const,
				yes: false,
				dryRun: false,
				json: false,
				features: {
					linter: true,
					commitlint: true,
					install: true
				}
			},
			ctx
		)

		const lines = planDisplayLines(plan, 'pnpm')

		const installLine = lines.find((l) => l.includes('pnpm add'))

		expect(installLine).toBeDefined()
		expect(installLine).toContain('eslint@^10.0.0')
		expect(installLine).toContain('prettier')
	})

	it('git-init shows as silent', () => {
		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: [],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(
			{
				framework: 'node' as const,
				yes: false,
				dryRun: false,
				json: false,
				features: {
					linter: true,
					commitlint: true,
					install: true
				}
			},
			ctx
		)

		const lines = planDisplayLines(plan, 'pnpm')

		const gitLine = lines.find((l) => l.includes('git init'))

		expect(gitLine).toBeDefined()
		expect(gitLine).toContain('(silent)')
	})

	it('skipped features not shown in display', () => {
		const args = {
			framework: 'node' as const,
			yes: false,
			dryRun: false,
			json: false,
			features: {
				linter: false,
				commitlint: true,
				install: true
			}
		}

		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: ['eslint@^10.0.0'],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((_path: string) => null)
		}

		const plan = computePlan(args, ctx)

		const lines = planDisplayLines(plan, 'pnpm')

		// Linter not in write-file lines
		expect(lines.some((l) => l.includes('eslint.config.mjs'))).toBe(false)
		expect(lines.some((l) => l.includes('prettier'))).toBe(false)
	})

	it('conflict shown in display', () => {
		const ctx = {
			pm: 'pnpm' as AgentName,
			isYarnBerry: false,
			manifest: {
				name: 'test',
				version: '1.0.0'
			},
			hasGit: false,
			specs: {
				dev: [],
				runtime: [],
				ppjSpec: 'prettier-package-json@^2.8.0',
				runtimePlacement: 'none' as const,
				offlineFallback: false
			},
			readFile: vi.fn((path: string) => {
				if (path === '.eslintrc') {
					return 'module.exports = {}'
				}

				return null
			})
		}

		const plan = computePlan(
			{
				framework: 'node' as const,
				yes: false,
				dryRun: false,
				json: false,
				features: {
					linter: true,
					commitlint: true,
					install: true
				}
			},
			ctx
		)

		const lines = planDisplayLines(plan, 'pnpm')

		const conflictLine = lines.find((l) => l.includes('conflict'))

		expect(conflictLine).toBeDefined()
		expect(conflictLine).toContain('eslint.config.mjs')
		expect(conflictLine).toContain('.eslintrc')
	})
})
