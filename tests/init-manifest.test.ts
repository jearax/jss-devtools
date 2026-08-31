// Unit tests for init manifest utilities.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'path'

import { afterAll, describe, expect, it } from 'vitest'

import {
	readManifest,
	addScriptsWhenAbsent,
	setLintStagedWhenAbsent,
	declaredDependency,
	isLibraryManifest,
	serializeManifest
} from '@/commands/init/utils/manifest'

const testDirs: string[] = []

const newDir = (): string => {
	const dir = mkdtempSync(join(tmpdir(), 'init-manifest-test-'))

	testDirs.push(dir)

	return dir
}

afterAll(() => {
	for (const dir of testDirs) {
		rmSync(dir, {
			recursive: true,
			force: true
		})
	}

	testDirs.length = 0
})

describe('readManifest', () => {
	it('returns manifest and raw when valid JSON', () => {
		const cwd = newDir()

		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			dependencies: {}
		}

		const raw = JSON.stringify(manifest, null, 2)

		writeFileSync(join(cwd, 'package.json'), raw)

		const result = readManifest(cwd)

		expect(result).toEqual({
			manifest,
			raw
		})
	})

	it('returns "missing" when package.json does not exist', () => {
		const cwd = newDir()
		const result = readManifest(cwd)

		expect(result).toBe('missing')
	})

	it('returns "invalid" when package.json contains invalid JSON', () => {
		const cwd = newDir()

		writeFileSync(join(cwd, 'package.json'), '{ invalid json ')

		const result = readManifest(cwd)

		expect(result).toBe('invalid')
	})
})

describe('addScriptsWhenAbsent', () => {
	it('adds new scripts when they do not exist', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0'
		}

		const scripts = {
			prepare: 'husky',
			format: 'eslint --fix . && prettier --write .'
		}

		const result = addScriptsWhenAbsent(manifest, scripts)

		expect(result.manifest).toHaveProperty('scripts')
		expect(result.manifest.scripts).toEqual(scripts)
		expect(result.added).toEqual(['prepare', 'format'])
		expect(result.skippedExisting).toEqual([])
	})

	it('skips existing scripts and keeps their values', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			scripts: {
				prepare: 'my-prepare-hook',
				format: 'my-format-command'
			}
		}

		const scripts = {
			prepare: 'husky',
			format: 'eslint --fix . && prettier --write .'
		}

		const result = addScriptsWhenAbsent(manifest, scripts)

		expect(result.manifest).toHaveProperty('scripts')
		expect(result.manifest.scripts).toEqual({
			prepare: 'my-prepare-hook',
			format: 'my-format-command'
		})
		expect(result.added).toEqual([])
		expect(result.skippedExisting).toEqual(['prepare', 'format'])
	})

	it('handles non-object scripts gracefully', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			scripts: 'not-an-object'
		}

		const scripts = {
			prepare: 'husky'
		}

		const result = addScriptsWhenAbsent(manifest, scripts)

		expect(result.manifest).toHaveProperty('scripts')
		expect(result.manifest.scripts).toEqual(scripts)
		expect(result.added).toEqual(['prepare'])
		expect(result.skippedExisting).toEqual([])
	})
})

describe('setLintStagedWhenAbsent', () => {
	it('adds lint-staged when not present', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0'
		}

		const lintStaged = {
			'**/*.{js,ts,tsx}': ['eslint --fix', 'prettier --write']
		}

		const result = setLintStagedWhenAbsent(manifest, lintStaged)

		expect(result.manifest).toHaveProperty('lint-staged')
		expect(result.manifest['lint-staged']).toEqual(lintStaged)
		expect(result.skipped).toBe(false)
	})

	it('skips when lint-staged already exists', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			'lint-staged': {
				'**/*.{js,ts}': ['eslint --fix']
			}
		}

		const lintStaged = {
			'**/*.{js,ts,tsx}': ['eslint --fix', 'prettier --write']
		}

		const result = setLintStagedWhenAbsent(manifest, lintStaged)

		expect(result.manifest).toHaveProperty('lint-staged')
		expect(result.manifest['lint-staged']).toEqual({
			'**/*.{js,ts}': ['eslint --fix']
		})
		expect(result.skipped).toBe(true)
	})
})

describe('declaredDependency', () => {
	it('finds dependency in dependencies field', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			dependencies: {
				eslint: '^10.0.0',
				react: '^18.0.0'
			}
		}

		const spec = declaredDependency(manifest, 'eslint')

		expect(spec).toBe('^10.0.0')
	})

	it('finds dependency in devDependencies field', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			devDependencies: {
				typescript: '^5.0.0'
			}
		}

		const spec = declaredDependency(manifest, 'typescript')

		expect(spec).toBe('^5.0.0')
	})

	it('finds dependency in peerDependencies field', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			peerDependencies: {
				react: '^18.0.0'
			}
		}

		const spec = declaredDependency(manifest, 'react')

		expect(spec).toBe('^18.0.0')
	})

	it('finds dependency in optionalDependencies field', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			optionalDependencies: {
				webpack: '^5.0.0'
			}
		}

		const spec = declaredDependency(manifest, 'webpack')

		expect(spec).toBe('^5.0.0')
	})

	it('returns undefined when dependency not declared', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			dependencies: {
				eslint: '^10.0.0'
			}
		}

		const spec = declaredDependency(manifest, 'prettier')

		expect(spec).toBeUndefined()
	})

	it('returns undefined when field is not an object', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			dependencies: 'not-an-object'
		}

		const spec = declaredDependency(manifest, 'eslint')

		expect(spec).toBeUndefined()
	})
})

describe('isLibraryManifest', () => {
	it('returns false when private is true', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			private: true
		}

		const isLibrary = isLibraryManifest(manifest)

		expect(isLibrary).toBe(false)
	})

	it('returns true when exports is defined and private is false', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			exports: {
				'.': './src/index.ts'
			}
		}

		const isLibrary = isLibraryManifest(manifest)

		expect(isLibrary).toBe(true)
	})

	it('returns true when types is defined and private is false', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			types: './src/index.d.ts'
		}

		const isLibrary = isLibraryManifest(manifest)

		expect(isLibrary).toBe(true)
	})

	it('returns false when both exports and types are missing', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0'
		}

		const isLibrary = isLibraryManifest(manifest)

		expect(isLibrary).toBe(false)
	})

	it('returns false when both exports and types exist but private is true', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0',
			private: true,
			exports: {
				'.': './src/index.ts'
			}
		}

		const isLibrary = isLibraryManifest(manifest)

		expect(isLibrary).toBe(false)
	})
})

describe('serializeManifest', () => {
	it('serializes manifest to JSON string', () => {
		const manifest: Record<string, unknown> = {
			name: 'test',
			version: '1.0.0'
		}

		const serialized = serializeManifest(manifest)

		expect(serialized).toBe(JSON.stringify(manifest, null, 2) + '\n')
	})
})
