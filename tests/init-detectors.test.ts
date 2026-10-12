// Unit tests for init detector modules — pure filesystem fixtures.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

import { detectMonorepo } from '@/core/detector/monorepo-signals'
import { detectProjectAgent } from '@/core/detector/project-pm'

const testDirs: string[] = []

const newDir = (): string => {
	const dir = mkdtempSync(join(tmpdir(), 'init-detector-test-'))

	testDirs.push(dir)

	return dir
}

const writePkgJson = (cwd: string, fields: Record<string, unknown>): void => {
	writeFileSync(join(cwd, 'package.json'), JSON.stringify(fields, null, 2))
}

afterEach(() => {
	vi.restoreAllMocks()
})

afterAll(() => {
	for (const dir of testDirs) {
		rmSync(dir, {
			recursive: true,
			force: true
		})
	}

	testDirs.length = 0
})

describe('detectProjectAgent', () => {
	it.each([
		['pnpm-lock.yaml', 'pnpm'],
		['package-lock.json', 'npm'],
		['bun.lock', 'bun']
	] as const)('%s → %s', async (lockfile, agent) => {
		const cwd = newDir()

		writePkgJson(cwd, { name: 'x' })
		writeFileSync(join(cwd, lockfile), '')

		expect(await detectProjectAgent(cwd)).toBe(agent)
	})

	it('packageManager field distinguishes yarn classic from berry', async () => {
		const classic = newDir()
		const berry = newDir()

		writePkgJson(classic, { packageManager: 'yarn@1.22.22' })
		writePkgJson(berry, { packageManager: 'yarn@4.9.0' })

		expect(await detectProjectAgent(classic)).toBe('yarn')
		expect(await detectProjectAgent(berry)).toBe('yarn@berry')
	})

	it('unsupported agent (deno) → null', async () => {
		const cwd = newDir()

		writePkgJson(cwd, { packageManager: 'deno@2.0.0' })

		expect(await detectProjectAgent(cwd)).toBeNull()
	})
})

describe('detectMonorepo', () => {
	it('pnpm-workspace.yaml → returns evidence', () => {
		const cwd = newDir()

		writeFileSync(join(cwd, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n')

		const monorepo = detectMonorepo(cwd, {})

		expect(monorepo).toEqual({
			evidence: 'pnpm-workspace.yaml'
		})
	})

	it('pnpm-workspace.yaml holding only settings (pnpm 11 single package) → null', () => {
		const cwd = newDir()

		writeFileSync(join(cwd, 'pnpm-workspace.yaml'), 'allowBuilds:\n  unrs-resolver: true\n')

		expect(detectMonorepo(cwd, {})).toBeNull()
	})

	it('workspaces.packages array → returns evidence', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			workspaces: {
				packages: ['packages/*']
			}
		}

		const monorepo = detectMonorepo(cwd, manifest)

		expect(monorepo).toEqual({
			evidence: 'package.json "workspaces" field'
		})
	})

	it('empty workspaces.packages array → null', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			workspaces: {
				packages: []
			}
		}

		const monorepo = detectMonorepo(cwd, manifest)

		expect(monorepo).toBeNull()
	})

	it('workspace:* protocol dep in dependencies → returns evidence', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			dependencies: {
				'@my/lib': 'workspace:*'
			}
		}

		const monorepo = detectMonorepo(cwd, manifest)

		expect(monorepo).toEqual({
			evidence: 'workspace:* protocol dependency'
		})
	})

	it('workspace:* protocol dep in devDependencies → returns evidence', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			devDependencies: {
				'@my/lib': 'workspace:^1.0.0'
			}
		}

		const monorepo = detectMonorepo(cwd, manifest)

		expect(monorepo).toEqual({
			evidence: 'workspace:* protocol dependency'
		})
	})

	it('workspace:* protocol dep in peerDependencies → returns evidence', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			peerDependencies: {
				'@my/lib': 'workspace:*'
			}
		}

		const monorepo = detectMonorepo(cwd, manifest)

		expect(monorepo).toEqual({
			evidence: 'workspace:* protocol dependency'
		})
	})

	it('workspace:* protocol dep in optionalDependencies → returns evidence', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			optionalDependencies: {
				'@my/lib': 'workspace:*'
			}
		}

		const monorepo = detectMonorepo(cwd, manifest)

		expect(monorepo).toEqual({
			evidence: 'workspace:* protocol dependency'
		})
	})

	it('no signals → null', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			dependencies: {}
		}

		const monorepo = detectMonorepo(cwd, manifest)

		expect(monorepo).toBeNull()
	})

	it('workspaces field not object → null', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			workspaces: 'packages/*'
		}

		const monorepo = detectMonorepo(cwd, manifest)

		expect(monorepo).toBeNull()
	})
})
