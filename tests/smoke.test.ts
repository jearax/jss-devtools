import { execSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const binPath = join(repoRoot, 'dist', 'cli', 'cli.js')

// Vitest injects NODE_PATH / NODE_ENV=test / VITEST_* into the environment;
// the CLI child must run with production-like env or module resolution and
// consola behavior diverge from real usage.
const cleanEnv = (): NodeJS.ProcessEnv => {
	const env = { ...process.env }

	delete env.NODE_PATH
	delete env.NODE_ENV

	for (const key of Object.keys(env)) {
		if (key.startsWith('VITEST')) {
			delete env[key]
		}
	}

	return env
}

const runBin = (args: string[]): string => {
	const argList = args.map((a) => `'${a}'`).join(' ')

	return execSync(`node '${binPath}' ${argList} 2>&1`, {
		encoding: 'utf-8',
		cwd: repoRoot,
		env: cleanEnv()
	}).trim()
}

// Variant capturing exit code — needed for failure-path assertions.
// Uses spawnSync (no throw, reliable pipe capture under vitest forks).
const runBinAllowFail = (args: string[]): { output: string; exitCode: number } => {
	const res = spawnSync('node', [binPath, ...args], {
		encoding: 'utf-8',
		cwd: repoRoot,
		env: cleanEnv()
	})

	return {
		output: `${res.stdout ?? ''}${res.stderr ?? ''}`.trim(),
		exitCode: res.status ?? 1
	}
}

describe('bin/jss-devtools', () => {
	it('prints CLI version when --version is passed', () => {
		const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'))

		expect(runBin(['--version'])).toContain(pkg.version)
	})

	it('prints CLI version when -v is passed', () => {
		const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'))

		expect(runBin(['-v'])).toContain(pkg.version)
	})

	it('prints --help with banner + usage', () => {
		const output = runBin(['--help'])

		expect(output).toContain('JavaScript stack dev tools CLI')
		expect(output.toLowerCase()).toContain('usage')
	})

	// Note: testing the no-subcommand default hint is skipped because consola's
	// async stdout writes get truncated when execSync returns before buffer drains.
	// Verified manually via `node dist/cli/cli.js`.

	it('runs version subcommand with banner', () => {
		const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'))
		const output = runBin(['version'])

		expect(output).toContain('JavaScript stack dev tools CLI')
		expect(output).toContain(pkg.version)
	})

	it('runs help subcommand with banner + usage', () => {
		const output = runBin(['help'])

		expect(output).toContain('JavaScript stack dev tools CLI')
		expect(output.toLowerCase()).toContain('usage')
	})

	it('lists only version, help and init in --help', () => {
		const output = runBin(['--help'])

		expect(output).toMatch(/^\s+init\b/m)

		for (const removed of ['update', 'upgrade', 'downgrade', 'uninstall']) {
			expect(output).not.toMatch(new RegExp(`^\\s+${removed}\\b`, 'm'))
		}
	})

	it.each(['update', 'upgrade', 'downgrade', 'uninstall'])('rejects removed self command %s', (cmd) => {
		const { exitCode } = runBinAllowFail([cmd])

		expect(exitCode).not.toBe(0)
	})
})
