// Unit tests for init spec resolution with mocked fetch-package.
import { describe, expect, it, vi } from 'vitest'

import { resolveSpecs } from '@/commands/init/install/resolve-specs'
import { getPreset } from '@/commands/init/presets/get-preset'
import { InitFeatures } from '@/commands/init/types'
import { fetchPackageMetadata } from '@/core/registry-client/fetch-package'
import { PackageMetadata } from '@/core/registry-client/types'

vi.mock('@/core/registry-client/fetch-package', () => ({
	fetchPackageMetadata: vi.fn()
}))

const mockedFetch = vi.mocked(fetchPackageMetadata)

describe('resolveSpecs', () => {
	const defaultFeatures = {
		linter: true,
		commitlint: true,
		install: true
	} satisfies InitFeatures

	const defaultManifest = {
		name: 'test',
		version: '1.0.0'
	}

	it('includes all house linter packages without user deps', async () => {
		mockedFetch.mockResolvedValue({
			name: 'test',
			versions: ['1.0.0'],
			versionDocs: { '1.0.0': { peerDependencies: {} } },
			'dist-tags': { latest: '1.0.0' }
		})

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		expect(specs.dev).toContain('eslint@^1.0.0')
		expect(specs.dev).toContain('@eslint/js@^1.0.0')
		expect(specs.dev).toContain('@typescript-eslint/parser@^1.0.0')
		expect(specs.dev).toContain('@typescript-eslint/eslint-plugin@^1.0.0')
		expect(specs.dev).toContain('eslint-config-prettier@^1.0.0')
		expect(specs.dev).toContain('eslint-plugin-import-x@^1.0.0')
		expect(specs.dev).toContain('eslint-plugin-autofix@^1.0.0')
		expect(specs.dev).toContain('eslint-plugin-prefer-arrow-functions@^1.0.0')
		expect(specs.dev).toContain('eslint-plugin-prettier@^1.0.0')
		expect(specs.dev).toContain('prettier@^1.0.0')
		expect(specs.dev).toContain('globals@^1.0.0')
		expect(specs.dev).toContain('husky@^1.0.0')
		expect(specs.dev).toContain('lint-staged@^1.0.0')
		expect(specs.dev).toContain('typescript@^1.0.0')
	})

	it('excludes user-declared packages', async () => {
		mockedFetch.mockResolvedValue({
			name: 'test',
			versions: ['1.0.0'],
			versionDocs: { '1.0.0': { peerDependencies: {} } },
			'dist-tags': { latest: '1.0.0' }
		})

		const manifest = {
			name: 'test',
			version: '1.0.0',
			devDependencies: {
				eslint: '^10.0.0',
				prettier: '^10.0.0'
			}
		}

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, manifest)

		expect(specs.dev).not.toContain('eslint@^10.0.0')
		expect(specs.dev).not.toContain('prettier@^10.0.0')
	})

	it('peer-aware pick: newest version satisfying peer ranges', async () => {
		const mockFetch = vi.fn(async (name: string): Promise<PackageMetadata> => {
			if (name === 'eslint') {
				return {
					name: 'eslint',
					versions: ['9.0.0', '10.0.0', '11.0.0'],
					versionDocs: {
						'9.0.0': {
							peerDependencies: {}
						},
						'10.0.0': {
							peerDependencies: {
								typescript: '>=4.0.0'
							}
						},
						'11.0.0': {
							peerDependencies: {
								typescript: '>=4.0.0'
							}
						}
					},
					'dist-tags': { latest: '11.0.0' }
				}
			}

			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		// eslint@^11.0.0 should be chosen over 10.0.0 (newer peer-satisfying version)
		const eslintSpec = specs.dev.find((s) => s.startsWith('eslint@'))

		expect(eslintSpec).toBe('eslint@^11.0.0')
	})

	it('user-declared pkg filtered out in runtime', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		expect(specs.dev).toContain('typescript@^1.0.0')
	})

	it('offline fallback: registry throws → uses @latest', async () => {
		mockedFetch.mockRejectedValue(new Error('Network error'))

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		expect(specs.offlineFallback).toBe(true)
		expect(specs.dev).toContain('eslint@latest')
		expect(specs.dev).toContain('prettier@latest')
	})

	it('offlineFallback false when all specs resolve', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		expect(specs.offlineFallback).toBe(false)
	})

	it('commitlint packages included when feature enabled', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		expect(specs.dev).toContain('@commitlint/cli@^1.0.0')
		expect(specs.dev).toContain('@commitlint/config-conventional@^1.0.0')
	})

	it('commitlint packages excluded when feature disabled', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const features = {
			linter: true,
			commitlint: false,
			install: true
		}

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, features, defaultManifest)

		expect(specs.dev).not.toContain('@commitlint/cli@^1.0.0')
		expect(specs.dev).not.toContain('@commitlint/config-conventional@^1.0.0')
	})

	it('runtime deps placement: app → dependencies', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		expect(specs.runtimePlacement).toBe('dependencies')
	})

	it('runtime deps placement: library (private false, exports) → peer+dev', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const manifest = {
			name: 'test',
			version: '1.0.0',
			exports: {
				'.': './src/index.ts'
			}
		}

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, manifest)

		expect(specs.runtimePlacement).toBe('peer+dev')
	})

	it('runtime deps placement: library (non-private, types) → peer+dev', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const manifest = {
			name: 'test',
			version: '1.0.0',
			types: './src/index.d.ts'
		}

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, manifest)

		expect(specs.runtimePlacement).toBe('peer+dev')
	})

	it('runtime deps placement: private true → dependencies', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const manifest = {
			name: 'test',
			version: '1.0.0',
			private: true
		}

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, manifest)

		expect(specs.runtimePlacement).toBe('dependencies')
	})

	it('eslint anchors plugin peer windows, picks compatible version', async () => {
		const mockFetch = vi.fn(async (name: string): Promise<PackageMetadata> => {
			if (name === 'eslint') {
				return {
					name: 'eslint',
					versions: ['9.0.0', '10.0.0', '11.0.0', '12.0.0'],
					versionDocs: {
						'9.0.0': {
							peerDependencies: {}
						},
						'10.0.0': {
							peerDependencies: {
								typescript: '>=4.0.0'
							}
						},
						'11.0.0': {
							peerDependencies: {
								typescript: '>=5.0.0'
							}
						},
						'12.0.0': {
							peerDependencies: {
								typescript: '>=5.0.0'
							}
						}
					},
					'dist-tags': { latest: '12.0.0' }
				}
			}

			if (name === '@typescript-eslint/parser') {
				return {
					name: '@typescript-eslint/parser',
					versions: ['8.0.0', '9.0.0', '10.0.0', '11.0.0'],
					versionDocs: {
						'8.0.0': {
							peerDependencies: {}
						},
						'9.0.0': {
							peerDependencies: {
								eslint: '^9.0.0'
							}
						},
						'10.0.0': {
							peerDependencies: {
								eslint: '^12.0.0'
							}
						},
						'11.0.0': {
							peerDependencies: {
								eslint: '^12.0.0'
							}
						}
					},
					'dist-tags': { latest: '11.0.0' }
				}
			}

			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		// TypeScript >=5.0.0 not yet chosen, so eslint should pick 12.0.0 (highest satisfying)
		const eslintSpec = specs.dev.find((s) => s.startsWith('eslint@'))

		expect(eslintSpec).toBe('eslint@^12.0.0')

		// Parser should pick 11.0.0 (highest satisfying eslint ^12.0.0)
		const parserSpec = specs.dev.find((s) => s.startsWith('@typescript-eslint/parser@'))

		expect(parserSpec).toBe('@typescript-eslint/parser@^11.0.0')
	})

	it('excludes from dev when linter feature off', async () => {
		const mockFetch = vi.fn(async (_name: string) => {
			return {
				name: 'test',
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		})

		mockedFetch.mockImplementation(mockFetch)

		const features = {
			linter: false,
			commitlint: true,
			install: true
		}

		const preset = getPreset('react')
		const specs = await resolveSpecs(preset, features, defaultManifest)

		expect(specs.dev).not.toContain('eslint@^1.0.0')
		expect(specs.dev).not.toContain('@eslint/js@^1.0.0')
		expect(specs.dev).not.toContain('prettier@^1.0.0')
		expect(specs.dev).toContain('husky@^1.0.0')
		expect(specs.dev).toContain('lint-staged@^1.0.0')
		expect(specs.dev).toContain('typescript@^1.0.0')
		expect(specs.dev).toContain('@commitlint/cli@^1.0.0')
		expect(specs.dev).toContain('@commitlint/config-conventional@^1.0.0')
	})

	it('legacy major stream is skipped when peer would accidentally satisfy anchors', async () => {
		// Reproduces the @typescript-eslint/parser@1.x bug: legacy 1.x peer
		// `eslint: ">=4.19.1"` technically satisfies eslint@10.x anchors,
		// but the 1.x runtime API is incompatible with eslint 8+/10. The
		// picker biases toward the ecosystem-current major (8.x).
		const parserMetadata = {
			name: '@typescript-eslint/parser',
			versions: ['8.68.0', '7.0.0', '1.1.0'],
			versionDocs: {
				'8.68.0': { peerDependencies: { eslint: '^8.57.0 || ^9.0.0 || ^10.0.0' } },
				'7.0.0': { peerDependencies: { eslint: '^7.0.0 || ^8.0.0' } },
				'1.1.0': { peerDependencies: { eslint: '>=4.19.1' } }
			},
			'dist-tags': { latest: '8.68.0' }
		}

		const fakeMetadata = (pkg: string) => {
			if (pkg === '@typescript-eslint/parser') {
				return parserMetadata
			}

			return {
				name: pkg,
				versions: ['10.0.0'],
				versionDocs: { '10.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '10.0.0' }
			}
		}

		mockedFetch.mockImplementation(async (pkg: string) => fakeMetadata(pkg))

		const preset = getPreset('node')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		expect(specs.dev).toContain('@typescript-eslint/parser@^8.68.0')
		expect(specs.dev).not.toContain('@typescript-eslint/parser@^1.1.0')
	})

	it('typescript anchor capped to ecosystem-safe major', async () => {
		// typescript 7.x is real (current stable), but the eslint-ecosystem
		// typescript plugin majors trail it. Anchoring typescript to a major
		// the downstream @typescript-eslint/parser@8.x accepts avoids the
		// `npm install` peer rejection the manual campaign surfaced.
		const tsMetadata = {
			name: 'typescript',
			versions: ['7.0.2', '6.0.3', '5.9.3'],
			versionDocs: {
				'7.0.2': { peerDependencies: {} },
				'6.0.3': { peerDependencies: {} },
				'5.9.3': { peerDependencies: {} }
			},
			'dist-tags': { latest: '7.0.2' }
		}

		const fakeMetadata = (pkg: string) => {
			if (pkg === 'typescript') {
				return tsMetadata
			}

			return {
				name: pkg,
				versions: ['1.0.0'],
				versionDocs: { '1.0.0': { peerDependencies: {} } },
				'dist-tags': { latest: '1.0.0' }
			}
		}

		mockedFetch.mockImplementation(async (pkg: string) => fakeMetadata(pkg))

		const preset = getPreset('node')
		const specs = await resolveSpecs(preset, defaultFeatures, defaultManifest)

		expect(specs.dev).toContain('typescript@^5.9.3')
		expect(specs.dev).not.toContain('typescript@^7.0.2')
		expect(specs.dev).not.toContain('typescript@^6.0.3')
	})
})
