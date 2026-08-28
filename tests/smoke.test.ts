import { execSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterAll, describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const binPath = join(repoRoot, 'dist', 'cli', 'cli.js')

// Isolated store dir so spawned CLI runs never touch the real user config
// (a machine with the CLI globally installed would otherwise write a real
// pmLedger into ~/Library/Preferences during `pnpm test`).
const smokeStoreDir = mkdtempSync(join(tmpdir(), 'jss-smoke-store-'))

afterAll(() => {
	rmSync(smokeStoreDir, {
		recursive: true,
		force: true
	})
})

// Vitest injects NODE_PATH / NODE_ENV=test / VITEST_* into the environment;
// the CLI child must run with production-like env or module resolution and
// consola behavior diverge from real usage.
const cleanEnv = (): NodeJS.ProcessEnv => {
	const env = { ...process.env }

	delete env.NODE_PATH
	delete env.NODE_ENV
	env.JSS_DEVTOOLS_STORE_DIR = smokeStoreDir

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

	it('runs upgrade --help with banner + subcommand name', () => {
		const output = runBin(['upgrade', '--help'])

		expect(output).toContain('Upgrade CLI') // subcommand description
		expect(output.toLowerCase()).toContain('upgrade')
	})

	it('runs downgrade --help with banner + subcommand name', () => {
		const output = runBin(['downgrade', '--help'])

		expect(output).toContain('Downgrade CLI') // subcommand description
		expect(output.toLowerCase()).toContain('downgrade')
	})

	it('runs uninstall --help with banner + subcommand name', () => {
		const output = runBin(['uninstall', '--help'])

		expect(output).toContain('Uninstall CLI') // subcommand description
		expect(output.toLowerCase()).toContain('uninstall')
	})

	it('runs update --help with banner + subcommand name', () => {
		const output = runBin(['update', '--help'])

		expect(output).toContain('Update CLI') // subcommand description
		expect(output.toLowerCase()).toContain('update')
	})

	it('runs update check --help with banner + update help (manual dispatch)', () => {
		const output = runBin(['update', 'check', '--help'])

		// citty renders the parent update help before run() — check is a
		// manual dispatch target inside run(), not a citty subcommand.
		expect(output).toContain('Update CLI') // update description
		expect(output.toLowerCase()).toContain('check') // specVer arg description mentions check
	})
})

// Self-command hardening (uninstall-command-design plan, phase-01).
// execSync = non-TTY context, which is exactly what these paths exercise.
// Note: machine-dependent — when the CLI is NOT installed globally the guard
// is never reached (PM_NOT_DETECTED fires first), so assertions accept both.
describe('self-command non-TTY behavior', () => {
	it('uninstall without --yes in non-TTY refuses with error JSON (or PM not detected)', () => {
		const { output, exitCode } = runBinAllowFail(['uninstall', '--json'])

		expect(exitCode).not.toBe(0)
		expect(output).toContain('"result": "error"')
		expect(output.includes('REQUIRES_CONFIRMATION') || output.includes('PM_NOT_DETECTED')).toBe(true)
	})

	it('uninstall --yes --dry-run --json reports dry-run status when PM is detected', () => {
		const { output, exitCode } = runBinAllowFail(['uninstall', '--yes', '--dry-run', '--json'])

		// Accept both outcomes: dry-run success (installed) or PM_NOT_DETECTED (clean CI).
		if (exitCode === 0) {
			expect(output).toContain('"result": "dry-run"')
		} else {
			expect(output).toContain('PM_NOT_DETECTED')
		}
	})

	it('upgrade --yes --dry-run --json still auto-proceeds in non-TTY (no destructive guard)', () => {
		const { output, exitCode } = runBinAllowFail(['upgrade', '--yes', '--dry-run', '--json'])

		// Registry fetch for unpublished package fails, but it must NOT be
		// REQUIRES_CONFIRMATION — that proves the guard is uninstall-only.
		if (exitCode !== 0) {
			expect(output).not.toContain('REQUIRES_CONFIRMATION')
		}
	})

	it('update check --json executes only the check handler', () => {
		const { output, exitCode } = runBinAllowFail(['update', 'check', '--json'])

		// Registry reachable: the version-list document is the ONLY stdout
		// doc — the old citty double-exec (parent run after subcommand) is
		// gone. Offline: the handler fails fast without any upgrade attempt.
		if (exitCode === 0) {
			expect(output).toContain('"command": "update check"')
			expect(output).not.toContain('"command": "update"')
		} else {
			expect(output).toContain('Failed to fetch versions')
		}
	})
})
