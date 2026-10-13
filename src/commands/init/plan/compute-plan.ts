import {
	buildCommitlintConfigContent,
	COMMITLINT_CONFIG_PATH
} from '@/commands/init/generators/commitlint-config-content'
import { buildEditorconfigContent, EDITORCONFIG_PATH } from '@/commands/init/generators/editorconfig-content'
import { buildEslintConfigContent } from '@/commands/init/generators/eslint-config-content'
import {
	appendNodeModulesEntry,
	buildGitignoreContent,
	GITIGNORE_PATH
} from '@/commands/init/generators/gitignore-content'
import { buildHookContent, mergeHookContent, HuskyHookName } from '@/commands/init/generators/husky-hooks-content'
import { buildLintStagedConfig } from '@/commands/init/generators/lint-staged-content'
import { mergePnpmAllowBuilds, PNPM_WORKSPACE_PATH } from '@/commands/init/generators/pnpm-workspace-content'
import { buildPrettierConfigContent, PRETTIER_CONFIG_PATH } from '@/commands/init/generators/prettier-config-content'
import { buildScripts } from '@/commands/init/generators/scripts-content'
import { buildFreshTsconfig, mergeTsconfigAlias, TSCONFIG_PATH } from '@/commands/init/generators/tsconfig-content'
import {
	buildVscodeExtensionsContent,
	buildVscodeSettingsContent,
	VSCODE_EXTENSIONS_PATH,
	VSCODE_SETTINGS_PATH
} from '@/commands/init/generators/vscode-content'
import {
	COMMITLINT_CONFIG_VARIANTS,
	ESLINT_CONFIG_VARIANTS,
	PRETTIER_CONFIG_VARIANTS
} from '@/commands/init/plan/conflicts'
import { InitPlan, PlanAction, PlanContext } from '@/commands/init/plan/types'
import { InitArgs } from '@/commands/init/types'

export const ESLINT_CONFIG_PATH = 'eslint.config.mjs'

// Pure builder: all fs state arrives through PlanContext so the whole
// framework × flag matrix is unit-testable without touching disk.
export const computePlan = (args: InitArgs, ctx: PlanContext): InitPlan => {
	const actions: PlanAction[] = []
	const skipped: InitPlan['skipped'] = []

	if (!ctx.hasGit) {
		actions.push({ kind: 'git-init' })
	}

	// Content-equal writes drop silently (idempotent re-runs become no-ops);
	// a differing existing file stays in the action list so the confirm stage
	// can surface the overwrite.
	const pushWrite = (path: string, content: string): void => {
		if (ctx.readFile(path) === content) {
			return
		}

		actions.push({
			kind: 'write-file',
			path,
			content
		})
	}

	// An existing .editorconfig is the project's own source of truth.
	if (ctx.readFile(EDITORCONFIG_PATH) === null) {
		pushWrite(EDITORCONFIG_PATH, buildEditorconfigContent())
	}

	if (args.features.linter) {
		pushWrite(ESLINT_CONFIG_PATH, buildEslintConfigContent())
		pushWrite(PRETTIER_CONFIG_PATH, buildPrettierConfigContent())

		// Editor files are personal territory: create them when missing, never
		// rewrite a user's existing settings.
		if (ctx.readFile(VSCODE_SETTINGS_PATH) === null) {
			pushWrite(VSCODE_SETTINGS_PATH, buildVscodeSettingsContent())
		}

		if (ctx.readFile(VSCODE_EXTENSIONS_PATH) === null) {
			pushWrite(VSCODE_EXTENSIONS_PATH, buildVscodeExtensionsContent())
		}
	} else {
		skipped.push({
			feature: 'linter',
			reason: '--no-linter: eslint + prettier setup skipped'
		})
	}

	if (args.features.commitlint) {
		pushWrite(COMMITLINT_CONFIG_PATH, buildCommitlintConfigContent())
	} else {
		skipped.push({
			feature: 'commitlint',
			reason: '--no-commitlint: commitlint setup skipped'
		})
	}

	if (ctx.pm === 'pnpm' && args.features.linter) {
		const outcome = mergePnpmAllowBuilds(ctx.readFile(PNPM_WORKSPACE_PATH))

		if (outcome.kind === 'write') {
			pushWrite(PNPM_WORKSPACE_PATH, outcome.content)
		} else {
			skipped.push({
				feature: 'linter',
				reason: `${PNPM_WORKSPACE_PATH}: ${outcome.reason}`
			})
		}
	}

	// Created when missing. An existing ignore list stays the user's own, but it
	// must cover the dependency tree install is about to create, or the tree
	// shows up untracked right after init.
	const existingGitignore = ctx.readFile(GITIGNORE_PATH)

	if (existingGitignore === null) {
		pushWrite(GITIGNORE_PATH, buildGitignoreContent())
	} else {
		const updated = appendNodeModulesEntry(existingGitignore)

		if (updated !== null) {
			actions.push({
				kind: 'update-file',
				path: GITIGNORE_PATH,
				content: updated
			})
		}
	}

	const existingTsconfig = ctx.readFile(TSCONFIG_PATH)

	if (existingTsconfig === null) {
		actions.push({
			kind: 'write-file',
			path: TSCONFIG_PATH,
			content: buildFreshTsconfig()
		})
	} else {
		const outcome = mergeTsconfigAlias(existingTsconfig)

		if (outcome.kind === 'write') {
			actions.push({
				kind: 'write-file',
				path: TSCONFIG_PATH,
				content: outcome.content
			})
		} else {
			skipped.push({
				feature: 'typescript',
				reason: `tsconfig.json: ${outcome.reason} — left untouched`
			})
		}
	}

	// Hooks: pre-commit needs the linter pair to have something to run;
	// commit-msg is driven by commitlint. Existing user lines always merge.
	const hookWrites: Array<{ path: string; hook: HuskyHookName }> = []

	if (args.features.linter) {
		hookWrites.push({
			path: '.husky/pre-commit',
			hook: 'pre-commit'
		})
	}

	if (args.features.commitlint) {
		hookWrites.push({
			path: '.husky/commit-msg',
			hook: 'commit-msg'
		})
	}

	for (const { path, hook } of hookWrites) {
		pushWrite(path, hookContent(ctx, path, hook))
	}

	if (hookWrites.length === 0) {
		skipped.push({
			feature: 'husky',
			reason: 'no hook-producing feature enabled (linter and commitlint both off)'
		})
	}

	// Manifest-edit field order is load-bearing: scripts first (cheap, always),
	// then lint-staged (depends on linter feature), then devDeps (only when
	// --no-install keeps them out of pm-add). Apply re-reads the file before
	// each edit, so adding a field below devDeps would mask earlier entries
	// unless it copies the map — pin any new field in this order.
	const manifestEdit: Extract<PlanAction, { kind: 'manifest-edit' }> = {
		kind: 'manifest-edit',
		scripts: buildScripts({ includeLinter: args.features.linter })
	}

	if (!args.features.linter) {
		skipped.push({
			feature: 'lint-staged',
			reason: '--no-linter: no staged tasks to configure'
		})
	} else if (ctx.manifest['lint-staged'] !== undefined) {
		skipped.push({
			feature: 'lint-staged',
			reason: 'package.json already has a lint-staged field'
		})
	} else {
		manifestEdit.lintStaged = buildLintStagedConfig()
	}

	if (!args.features.install) {
		manifestEdit.devDeps = specsToRecord(ctx.specs.dev)
	}

	actions.push(manifestEdit)

	if (args.features.install && ctx.specs.dev.length > 0) {
		actions.push({
			kind: 'install',
			devSpecs: ctx.specs.dev
		})
	}

	if (args.features.install) {
		actions.push({ kind: 'husky-activate' })
	} else {
		skipped.push({
			feature: 'install',
			reason: '--no-install: run your package manager install to activate hooks'
		})
	}

	return {
		actions,
		conflicts: [],
		skipped,
		pendingConflicts: scanVariantConflicts(ctx, actions)
	}
}

const hookContent = (ctx: PlanContext, path: string, hook: HuskyHookName): string => {
	const fresh = buildHookContent(hook, ctx.pm)
	const existing = ctx.readFile(path)

	if (existing === null) {
		return fresh
	}

	const managedLine = fresh.split('\n')[1] ?? ''

	return mergeHookContent(existing, managedLine)
}

const VARIANT_MAP: Array<{ target: string; variants: readonly string[] }> = [
	{
		target: ESLINT_CONFIG_PATH,
		variants: ESLINT_CONFIG_VARIANTS
	},
	{
		target: PRETTIER_CONFIG_PATH,
		variants: PRETTIER_CONFIG_VARIANTS
	},
	{
		target: COMMITLINT_CONFIG_PATH,
		variants: COMMITLINT_CONFIG_VARIANTS
	}
]

// Any existing config variant — including the target file itself when it
// differs — is a conflict the confirm stage must resolve before any write.
// An identical target produced no write action, so it is not a conflict.
const scanVariantConflicts = (ctx: PlanContext, actions: PlanAction[]): InitPlan['pendingConflicts'] =>
	VARIANT_MAP.flatMap(({ target, variants }) => {
		const writesTarget = actions.some((action) => action.kind === 'write-file' && action.path === target)

		const existing = variants.filter(
			(variant) => ctx.readFile(variant) !== null && (variant !== target || writesTarget)
		)

		return existing.length > 0
			? [
					{
						target,
						existing
					}
				]
			: []
	})

const specsToRecord = (specs: string[]): Record<string, string> => {
	const record: Record<string, string> = {}

	for (const spec of specs) {
		const at = spec.lastIndexOf('@')

		// No `@` (e.g. raw "prettier" left in offline paths) — keep the entry
		// as-is; --no-install callers write this map straight into the manifest.
		if (at <= 0) {
			record[spec] = ''
			continue
		}

		record[spec.slice(0, at)] = spec.slice(at + 1)
	}

	return record
}
