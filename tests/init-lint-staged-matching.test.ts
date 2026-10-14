import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'

import lintStaged from 'lint-staged'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildLintStagedConfig } from '@/commands/init/generators/lint-staged-content'

// Runs the generated patterns through lint-staged itself, so the test follows
// lint-staged's real matching rules (slash-less globs match basenames in every
// directory) instead of a re-implementation of them.
const repo = realpathSync(mkdtempSync(join(tmpdir(), 'jss-lint-staged-')))

const STAGED_FILES = [
	'package.json',
	'sub/package.json',
	'.claude/skills/ak-demo/package.json',
	'.claude/skills/ak-demo/scripts/package.json',
	'index.ts',
	'eslint.config.mjs',
	'vite.config.mts',
	'src/app.ts',
	'src/view.tsx',
	'app/page.jsx',
	'tests/app.test.ts',
	'.claude/skills/ak-demo/run.mjs',
	'.claude/skills/ak-demo/src/tool.ts',
	'.claude/skills/ak-demo/src/ui.tsx',
	'sub/index.ts',
	'sub/widget.jsx',
	'legacy.cjs'
]

const git = (...args: string[]): void => {
	execFileSync('git', args, {
		cwd: repo,
		stdio: 'ignore'
	})
}

const matchedByPattern = async (): Promise<Record<string, string[]>> => {
	const matched: Record<string, string[]> = {}
	const config: Record<string, { title: string; task: (files: readonly string[]) => void }> = {}

	for (const pattern of Object.keys(buildLintStagedConfig())) {
		matched[pattern] = []
		config[pattern] = {
			title: pattern,
			task: (files) => {
				matched[pattern] = files.map((file) => relative(repo, file)).sort()
			}
		}
	}

	const ok = await lintStaged({
		config,
		cwd: repo,
		quiet: true,
		stash: false
	})

	expect(ok).toBe(true)

	return matched
}

afterAll(() => {
	rmSync(repo, {
		recursive: true,
		force: true
	})
})

beforeAll(() => {
	git('init', '-q')

	for (const file of STAGED_FILES) {
		mkdirSync(join(repo, dirname(file)), { recursive: true })
		writeFileSync(join(repo, file), file.endsWith('.json') ? '{\n  "name": "x"\n}\n' : 'export {}\n')
	}

	git('add', '--all')
})

const touchedFiles = (matched: Record<string, string[]>): string[] => [...new Set(Object.values(matched).flat())].sort()

describe('generated lint-staged patterns', () => {
	it('formats only the root package.json, never nested manifests', async () => {
		const touched = touchedFiles(await matchedByPattern())

		expect(touched).toContain('package.json')
		expect(touched.filter((file) => file.endsWith('/package.json'))).toEqual([])
	})

	it('touches only root code files and the listed source folders', async () => {
		expect(touchedFiles(await matchedByPattern())).toEqual([
			'app/page.jsx',
			'eslint.config.mjs',
			'index.ts',
			'package.json',
			'src/app.ts',
			'src/view.tsx',
			'tests/app.test.ts',
			'vite.config.mts'
		])
	})

	it('has no slash-less pattern, which lint-staged would match in every directory', () => {
		expect(Object.keys(buildLintStagedConfig()).filter((pattern) => !pattern.includes('/'))).toEqual([])
	})
})
