import { $ } from 'bun'
import { cp, readFile, writeFile } from 'fs/promises'
import { join } from 'pathe'

import { logger } from '@/utils/logger'

const writePackageJson = async (type: 'cjs' | 'esm', dir: string) => {
	const pkgType = JSON.stringify({ type: type === 'esm' ? 'module' : 'commonjs' }, null, 2)
	await writeFile(join(dir, 'package.json'), pkgType)
}

const EXTERNAL_DEPS = [
	'consola',

	'prettier',
	'eslint',
	'@eslint/js',
	// typescript-eslint meta-package (primary) + standalone parser/plugin
	// (fallback). Config dynamically resolves whichever the consumer has.
	'typescript-eslint',

	'eslint-config-prettier',
	'eslint-plugin-prettier',
	'eslint-plugin-import',

	'eslint-plugin-react',
	'eslint-plugin-react-hooks',
	'eslint-plugin-react-native',
	'eslint-plugin-jsx-a11y',

	'eslint-plugin-autofix',
	'eslint-plugin-prefer-arrow-functions',
	'globals',

	'@next/eslint-plugin-next',
	'eslint-plugin-tailwindcss',
	'eslint-plugin-storybook'
]

const buildCJS = async () => {
	logger.log('Building CJS...')

	const result = await Bun.build({
		entrypoints: ['./src/index.ts'],
		outdir: './dist/cjs',
		target: 'node',
		format: 'cjs',
		naming: '[name].cjs',
		external: EXTERNAL_DEPS
	})

	if (!result.success) {
		throw new Error('CJS build failed: ' + result.logs.map((l) => l.message).join(', '))
	}

	await writePackageJson('cjs', 'dist/cjs')

	logger.log('CJS done!')
}

const buildESM = async () => {
	logger.log('Building ESM...')

	const result = await Bun.build({
		entrypoints: ['./src/index.ts'],
		outdir: './dist/esm',
		target: 'node',
		format: 'esm',
		external: EXTERNAL_DEPS
	})

	if (!result.success) {
		throw new Error('ESM build failed: ' + result.logs.map((l) => l.message).join(', '))
	}

	await writePackageJson('esm', 'dist/esm')

	logger.log('ESM done!')
}

const buildCLI = async () => {
	logger.log('Building CLI...')

	const result = await Bun.build({
		entrypoints: ['./src/cli.ts'],
		outdir: './dist/cli',
		target: 'node',
		format: 'esm',
		external: EXTERNAL_DEPS
	})

	if (!result.success) {
		throw new Error('CLI build failed: ' + result.logs.map((l) => l.message).join(', '))
	}

	await writePackageJson('esm', 'dist/cli')

	const finalizeCLI = async () => {
		const cliPaths = ['dist/cli/cli.js']
		for (const cliPath of cliPaths) {
			const content = await readFile(cliPath, 'utf-8')
			if (!content.startsWith('#!/usr/bin/env node')) {
				await writeFile(cliPath, '#!/usr/bin/env node\n' + content)
			}
		}

		// Skip chmod on Windows (not required)
		if (process.platform !== 'win32') {
			await Promise.all([$`chmod +x dist/cli/cli.js`])
			logger.log('CLI executable permission set!')
		} else {
			logger.log('Skipped chmod on Windows (not required)')
		}

		logger.log('CLI done!')
	}
	await finalizeCLI()
}

const buildTypes = async () => {
	logger.log('Building types...')

	await $`tsc -p tsconfig.types.json`
	await $`tsc-alias -p tsconfig.types.json`

	logger.log('Types done!')
}

const copyFonts = async () => {
	logger.log('Copying figlet fonts...')
	const fontsSrc = join('node_modules', 'figlet', 'fonts')
	await cp(fontsSrc, 'dist/fonts', { recursive: true })
	logger.log('Fonts copied')
}

const cleanBuild = async () => {
	logger.log('Cleaning...')
	await $`rimraf dist`
	logger.log('Cleaned')
}

const build = async () => {
	await cleanBuild()
	await buildTypes()
	await Promise.all([buildCJS(), buildESM(), buildCLI()])
	copyFonts()
	logger.log('Build complete!')
}

build().catch(logger.error)
