// Unit tests for init detector modules — pure filesystem fixtures.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'path'

import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

import { detectMonorepo } from '@/core/detector/monorepo-signals'
import { detectProjectPM, ProjectPM } from '@/core/detector/project-pm'

vi.mock('@/core/store', () => ({
	recordPmSeen: vi.fn(),
	getPmLedger: vi.fn(() => ({
		pmsSeen: [],
		lastPm: null,
		lastSeenAt: null
	}))
}))

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

describe('detectProjectPM', () => {
	it('packageManager field npm@8 → isYarnBerry false', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0',
			packageManager: 'npm@8.19.0'
		})

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'npm',
			source: 'packageManager-field',
			isYarnBerry: false
		})
	})

	it('packageManager field yarn@2 → isYarnBerry true', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0',
			packageManager: 'yarn@2.5.0'
		})

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'yarn',
			source: 'packageManager-field',
			isYarnBerry: true
		})
	})

	it('packageManager field yarn@1 → isYarnBerry false', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0',
			packageManager: 'yarn@1.22.0'
		})

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'yarn',
			source: 'packageManager-field',
			isYarnBerry: false
		})
	})

	it('packageManager field bun → isYarnBerry false', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0',
			packageManager: 'bun@1.0.0'
		})

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'bun',
			source: 'packageManager-field',
			isYarnBerry: false
		})
	})

	it('pnpm-lock.yaml → source lockfile, isYarnBerry false', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0'
		})
		writeFileSync(join(cwd, 'pnpm-lock.yaml'), 'lockfile content')

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'pnpm',
			source: 'lockfile',
			isYarnBerry: false
		})
	})

	it('package-lock.json → source lockfile, isYarnBerry false', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0'
		})
		writeFileSync(join(cwd, 'package-lock.json'), '{}')

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'npm',
			source: 'lockfile',
			isYarnBerry: false
		})
	})

	it('yarn.lock → source lockfile, isYarnBerry false (no .yarnrc.yml)', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0'
		})
		writeFileSync(join(cwd, 'yarn.lock'), 'lockfile content')

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'yarn',
			source: 'lockfile',
			isYarnBerry: false
		})
	})

	it('bun.lockb → source lockfile, isYarnBerry false', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0'
		})
		writeFileSync(join(cwd, 'bun.lockb'), Buffer.from('lockfile'))

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'bun',
			source: 'lockfile',
			isYarnBerry: false
		})
	})

	it('fallbackGuess called and returns value', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0'
		})

		const fallbackFn = vi.fn(async () => 'pnpm' as const)
		const pm = await detectProjectPM(cwd, fallbackFn)

		expect(fallbackFn).toHaveBeenCalled()
		expect(pm).toEqual<ProjectPM>({
			pm: 'pnpm',
			source: 'nypm-guess',
			isYarnBerry: false
		})
	})

	it('no lockfile, no packageManager, fallbackGuess returns null → returns null', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0'
		})

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toBeNull()
	})

	it('no package.json, no lockfile, fallbackGuess returns null → returns null', async () => {
		const cwd = newDir()
		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toBeNull()
	})

	it('.yarnrc.yml present with yarn lockfile → isYarnBerry true', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0'
		})
		writeFileSync(join(cwd, 'yarn.lock'), 'lockfile content')
		writeFileSync(join(cwd, '.yarnrc.yml'), 'nodeLinker: node-modules')

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm).toEqual<ProjectPM | null>({
			pm: 'yarn',
			source: 'lockfile',
			isYarnBerry: true
		})
	})

	it('fallbackGuess called for npm detection when only fallback returns', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0'
		})

		const fallbackFn = vi.fn(async () => 'npm' as const)
		const pm = await detectProjectPM(cwd, fallbackFn)

		expect(fallbackFn).toHaveBeenCalled()
		expect(pm).toEqual<ProjectPM>({
			pm: 'npm',
			source: 'nypm-guess',
			isYarnBerry: false
		})
	})

	it('packageManager field has precedence over lockfile', async () => {
		const cwd = newDir()

		writePkgJson(cwd, {
			name: 'test',
			version: '1.0.0',
			packageManager: 'pnpm@8.0.0'
		})
		writeFileSync(join(cwd, 'package-lock.json'), '{}')

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm?.source).toBe('packageManager-field')
		expect(pm?.pm).toBe('pnpm')
	})

	it('invalid JSON in package.json falls through to lockfile detection', async () => {
		const cwd = newDir()

		writeFileSync(join(cwd, 'package.json'), '{ invalid json ')
		writeFileSync(join(cwd, 'pnpm-lock.yaml'), 'lockfile')

		const pm = await detectProjectPM(cwd, async () => null)

		expect(pm?.source).toBe('lockfile')
		expect(pm?.pm).toBe('pnpm')
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
