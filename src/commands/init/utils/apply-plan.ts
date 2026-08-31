import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

import { AgentName } from 'package-manager-detector'
import { dirname, join } from 'pathe'

import { buildInstallCommands } from '@/commands/init/install/build-install-commands'
import { runCommandSpec } from '@/commands/init/install/run-command'
import { InitPlan, PlanAction } from '@/commands/init/plan/types'
import { InitConflictEntry, InitSkippedEntry } from '@/commands/init/types'
import { addScriptsWhenAbsent, serializeManifest, setLintStagedWhenAbsent } from '@/commands/init/utils/manifest'
import { localBinCommand } from '@/core/runner/pm-commands'

export interface ApplyOutcome {
	generated: string[]
	modified: string[]
	removed: string[]
	installed: string[]
	installOk: boolean | null
	huskyOk: boolean | null
	skipped: InitSkippedEntry[]
	conflicts: InitConflictEntry[]
	/** Actions that mutated anything — zero means the whole run was a no-op. */
	mutations: number
}

export interface ApplyDeps {
	cwd: string
	pm: AgentName
	/** Buffer child output (json mode). */
	capture?: boolean
	isWindows: boolean
}

const isHookFile = (path: string): boolean => path.startsWith('.husky/')

const applyManifestEdit = (
	action: Extract<PlanAction, { kind: 'manifest-edit' }>,
	outcome: ApplyOutcome,
	cwd: string
): void => {
	// Re-read from disk: apply stays correct even if earlier steps in this run
	// (or the user, in a parallel editor) touched the manifest.
	let raw: string

	try {
		raw = readFileSync(join(cwd, 'package.json'), 'utf8')
	} catch {
		return
	}

	let manifest: Record<string, unknown>

	try {
		manifest = JSON.parse(raw) as Record<string, unknown>
	} catch {
		outcome.skipped.push({
			feature: 'scripts',
			reason: 'package.json unreadable — scripts not added'
		})

		return
	}

	const scripts = addScriptsWhenAbsent(manifest, action.scripts)

	manifest = scripts.manifest

	for (const name of scripts.skippedExisting) {
		outcome.skipped.push({
			feature: 'scripts',
			reason: `script "${name}" already exists — kept yours`
		})
	}

	if (action.lintStaged !== undefined) {
		const lintStaged = setLintStagedWhenAbsent(manifest, action.lintStaged)

		manifest = lintStaged.manifest
	}

	if (action.devDeps !== undefined) {
		const devDeps =
			typeof manifest.devDependencies === 'object' && manifest.devDependencies !== null
				? (manifest.devDependencies as Record<string, string>)
				: {}

		manifest = {
			...manifest,
			devDependencies: {
				...devDeps,
				...action.devDeps
			}
		}
	}

	if (action.runtimePlacement !== undefined) {
		manifest = applyRuntimePlacement(manifest, action.runtimePlacement.specs, action.runtimePlacement.as)
	}

	writeFileSync(join(cwd, 'package.json'), serializeManifest(manifest))
	outcome.modified.push('package.json')
	outcome.mutations += 1
}

const applyRuntimePlacement = (
	manifest: Record<string, unknown>,
	specs: Record<string, string>,
	as: 'dependencies' | 'peer+dev'
): Record<string, unknown> => {
	let next = manifest

	const mergeField = (field: string, entries: Record<string, string>): void => {
		const current =
			typeof next[field] === 'object' && next[field] !== null ? (next[field] as Record<string, string>) : {}

		next = {
			...next,
			[field]: {
				...current,
				...entries
			}
		}
	}

	if (as === 'dependencies') {
		mergeField('dependencies', specs)

		return next
	}

	mergeField('peerDependencies', specs)

	// Dev copies let the library's own tooling resolve the peers locally.
	mergeField('devDependencies', specs)

	return next
}

export const applyPlan = async (plan: InitPlan, deps: ApplyDeps): Promise<ApplyOutcome> => {
	const outcome: ApplyOutcome = {
		generated: [],
		modified: [],
		removed: [],
		installed: [],
		installOk: null,
		huskyOk: null,
		skipped: [...plan.skipped],
		conflicts: [],
		mutations: 0
	}

	for (const action of plan.actions) {
		switch (action.kind) {
			case 'git-init': {
				// Silent both ways by design — git presence is an implementation
				// detail of husky, not a step the user needs narrated.
				const result = await runCommandSpec(
					{
						command: 'git',
						args: ['init', '-b', 'main']
					},
					{
						silent: true,
						capture: true
					}
				)

				if (!result.ok) {
					outcome.skipped.push({
						feature: 'git',
						reason: 'git init failed — is git installed?'
					})
				}

				break
			}

			case 'write-file': {
				const target = join(deps.cwd, action.path)

				mkdirSync(dirname(target), { recursive: true })
				writeFileSync(target, action.content)

				if (isHookFile(action.path) && !deps.isWindows) {
					// Husky v9 hook files are plain scripts — the exec bit is the
					// only permission git needs from them.
					chmodSync(target, 0o755)
				}

				outcome.generated.push(action.path)
				outcome.mutations += 1

				break
			}

			case 'remove-file': {
				rmSync(join(deps.cwd, action.path), { force: true })
				outcome.removed.push(action.path)
				outcome.conflicts.push({
					path: action.path,
					resolution: 'replaced'
				})
				outcome.mutations += 1

				break
			}

			case 'manifest-edit':
				applyManifestEdit(action, outcome, deps.cwd)

				break

			case 'install': {
				let commands: ReturnType<typeof buildInstallCommands>

				try {
					commands = buildInstallCommands(deps.pm, action.devSpecs, action.specs)
				} catch (error) {
					// Unsupported agent (e.g. a future PM without an `add` verb)
					// — keep the result envelope intact instead of throwing.
					outcome.installOk = false
					outcome.skipped.push({
						feature: 'install',
						reason: `install command unavailable for ${deps.pm}: ${error instanceof Error ? error.message : String(error)}`
					})

					break
				}

				let allOk = true

				for (const command of commands) {
					const result = await runCommandSpec(command, { capture: deps.capture })

					allOk = allOk && result.ok
				}

				outcome.installOk = commands.length > 0 ? allOk : null
				outcome.installed.push(...action.devSpecs, ...action.specs)
				outcome.mutations += commands.length

				break
			}

			case 'husky-activate': {
				const result = await runCommandSpec(localBinCommand(deps.pm, 'husky'), {
					capture: deps.capture
				})

				outcome.huskyOk = result.ok

				// Surface a user-facing message whenever the activation fails —
				// not only when the preceding install succeeded. Install may
				// have failed too, and the user still needs to know the hooks
				// were never wired up.
				if (!result.ok) {
					outcome.skipped.push({
						feature: 'husky',
						reason:
							outcome.installOk === true
								? 'husky activation failed — run your PM install manually'
								: 'husky activation skipped — install failed; hooks not wired'
					})
				}

				break
			}
		}
	}

	return outcome
}
