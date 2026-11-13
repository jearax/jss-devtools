import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { styleText } from 'node:util';

import { CONFIG_NAMES } from '@/commands/init/constants/config-name.constant';
import { commitlintConfigMjsTemplate } from '@/commands/init/templates/commitlint-config-mjs.template';
import { editorconfigTemplate } from '@/commands/init/templates/editorconfig.template';
import { eslintConfigMjsTemplate } from '@/commands/init/templates/eslint-config-mjs.template';
import { gitignoreTemplate } from '@/commands/init/templates/gitignore.template';
import { huskyCommitMsgTemplate } from '@/commands/init/templates/husky-commit-msg.template';
import { huskyPreCommitTemplate } from '@/commands/init/templates/husky-pre-commit.template';
import { packageJsonTemplate } from '@/commands/init/templates/package-json.template';
import { pnpmWorkspaceYamlExistingTemplate } from '@/commands/init/templates/pnpm-workspace-yaml.template';
import { prettierignoreTemplate } from '@/commands/init/templates/prettierignore.template';
import { prettierrcJsonTemplate } from '@/commands/init/templates/prettierrc-json.template';
import { srcMainTemplate } from '@/commands/init/templates/src-main.template';
import { tsconfigJsonTemplate } from '@/commands/init/templates/tsconfig-json.template';
import { vscodeExtensionsJsonTemplate } from '@/commands/init/templates/vscode-extensions-json.template';
import { vscodeSettingsJsonTemplate } from '@/commands/init/templates/vscode-settings-json.template';
import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';
import { CLAUDE_MD, CLAUDE_SETTINGS } from '@/modules/harness/constants/harness-paths.constant';
import { harnessInstallEntries } from '@/modules/harness/services/install-plan.service';

import { mergeHook, mergeLines, mergePackageJson, mergePnpmWorkspaceYaml } from './merge.service';
import { monorepoCreateModeEntries } from './monorepo-plan.service';
import { nestCreateModeEntries } from './nest-plan.service';
import { hookCommands, sharedToolchainEntries } from './shared-toolchain-plan.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPlan, InitPreflight, PlanEntry } from '@/commands/init/types/init-plan.type';

export const derivePackageName = (folder: string): string => {
	const name = folder
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/^[._-]+/, '')
		.replace(/-+$/, '')
		.slice(0, 214)
		.replace(/-+$/, '');

	if (name === '') {
		throw new CliError(`Not a valid package name: ${folder}`, {
			hint: 'Use a folder name with Latin letters or digits'
		});
	}

	return name;
};

const createModeEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	const { pm, projectName, pmVersion } = preflight;
	const packageName = derivePackageName(projectName);

	const at = (path: string, content: string): PlanEntry => {
		return {
			action: 'create',
			path,
			content
		};
	};

	return [
		at(
			'package.json',
			packageJsonTemplate({
				projectName: packageName,
				packageManager: pm,
				packageManagerVersion: pmVersion,
				nodeFloor: PACKAGE.nodeFloor
			})
		),
		at('tsconfig.json', tsconfigJsonTemplate()),
		at('src/main.ts', srcMainTemplate({ projectName })),
		...sharedToolchainEntries(pm, options.vscode, { eslintConfig: eslintConfigMjsTemplate() })
	];
};

const readIfExists = (dir: string, name: string): string | null => {
	const full = join(dir, name);

	return existsSync(full) ? readFileSync(full, 'utf8') : null;
};

const OWNED_TARGETS = new Set<string>(['eslint.config.mjs', '.prettierrc.json', 'commitlint.config.mjs']);

const existingModeEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	const { targetDir, pm, pmVersion, packageJson } = preflight;
	const force = options.force === true;
	const commands = hookCommands(pm);
	const entries: PlanEntry[] = [];

	if (packageJson === undefined) {
		throw new Error('existing mode needs the package.json read in preflight');
	}

	const merged = mergePackageJson(packageJson.parsed, {
		pm,
		pmVersion,
		force
	});

	if (merged !== null) {
		entries.push({
			action: 'update',
			path: 'package.json',
			content: merged
		});
	}

	const addShared = (path: string, fresh: string, command: string | null): void => {
		const raw = readIfExists(targetDir, path);

		if (raw === null) {
			entries.push({
				action: 'create',
				path,
				content: fresh
			});

			return;
		}

		const content = command === null ? mergeLines(raw, fresh) : mergeHook(raw, command);

		if (content !== null) {
			entries.push({
				action: 'update',
				path,
				content
			});
		}
	};

	addShared('.gitignore', gitignoreTemplate(), null);
	addShared('.prettierignore', prettierignoreTemplate(), null);
	addShared('.husky/pre-commit', huskyPreCommitTemplate({ command: commands.preCommit }), commands.preCommit);
	addShared('.husky/commit-msg', huskyCommitMsgTemplate({ command: commands.commitMsg }), commands.commitMsg);

	if (pm === 'pnpm') {
		const raw = readIfExists(targetDir, 'pnpm-workspace.yaml');

		if (raw === null) {
			entries.push({
				action: 'create',
				path: 'pnpm-workspace.yaml',
				content: pnpmWorkspaceYamlExistingTemplate()
			});
		} else {
			const merged = mergePnpmWorkspaceYaml(raw);

			if (merged.action === 'merged') {
				entries.push({
					action: 'update',
					path: 'pnpm-workspace.yaml',
					content: merged.content
				});
			}
		}
	}

	const owned: readonly (readonly [string, string])[] = [
		['eslint.config.mjs', eslintConfigMjsTemplate()],
		['.prettierrc.json', prettierrcJsonTemplate()],
		['.editorconfig', editorconfigTemplate()],
		['commitlint.config.mjs', commitlintConfigMjsTemplate()],
		...(options.vscode === false
			? []
			: ([
					['.vscode/settings.json', vscodeSettingsJsonTemplate({ packageManager: pm })],
					['.vscode/extensions.json', vscodeExtensionsJsonTemplate()]
				] as const))
	];

	for (const [path, fresh] of owned) {
		const raw = readIfExists(targetDir, path);

		if (raw === null) {
			entries.push({
				action: 'create',
				path,
				content: fresh
			});
		} else if (raw !== fresh) {
			entries.push({
				action: 'update',
				path,
				content: fresh
			});
		}
	}

	if (force) {
		for (const tool of ['eslint', 'prettier', 'commitlint'] as const) {
			for (const name of CONFIG_NAMES[tool].files) {
				if (OWNED_TARGETS.has(name)) {
					continue;
				}

				if (existsSync(join(targetDir, name))) {
					entries.push({
						action: 'delete',
						path: name
					});
				}
			}
		}
	}

	return entries;
};

const harnessEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	if (options.harness === false) {
		return [];
	}

	const claudeMd = readIfExists(preflight.targetDir, CLAUDE_MD);
	const settingsJson = readIfExists(preflight.targetDir, CLAUDE_SETTINGS);

	return harnessInstallEntries({
		mode: preflight.mode,
		agentKit: options.agentKit === true,
		claudeMd,
		settingsJson
	}).flatMap((file) => {
		const current =
			file.path === CLAUDE_MD
				? claudeMd
				: file.path === CLAUDE_SETTINGS
					? settingsJson
					: readIfExists(preflight.targetDir, file.path);

		if (current !== null && current === file.content) {
			return [];
		}

		return [
			{
				action: current === null ? ('create' as const) : ('update' as const),
				path: file.path,
				content: file.content
			}
		];
	});
};

export const buildInitPlan = (preflight: InitPreflight, options: InitOptions): InitPlan => {
	return {
		mode: preflight.mode,
		targetDir: preflight.targetDir,
		entries: [
			...(preflight.mode === 'create'
				? options.monorepo === true
					? monorepoCreateModeEntries(preflight, options)
					: options.framework === 'nest'
						? nestCreateModeEntries(preflight, options)
						: createModeEntries(preflight, options)
				: existingModeEntries(preflight, options)),
			...harnessEntries(preflight, options)
		]
	};
};

const PLAN_MARKS = {
	create: '+',
	update: '~',
	delete: '-'
} as const;

const PLAN_MARK_COLOURS = {
	create: 'green',
	update: 'yellow',
	delete: 'red'
} as const;

const PLAN_COUNT_LABELS = {
	create: 'to create',
	update: 'to update',
	delete: 'to delete'
} as const;

const renderPath = (path: string): string => {
	const slash = path.lastIndexOf('/');

	return slash === -1 ? path : `${styleText('dim', path.slice(0, slash + 1))}${path.slice(slash + 1)}`;
};

const planPathCollator = new Intl.Collator('en', {
	numeric: true,
	sensitivity: 'base'
});

export const comparePlanPaths = (a: string, b: string): number => {
	const aSegments = a.split('/');
	const bSegments = b.split('/');

	for (let i = 0; i < Math.min(aSegments.length, bSegments.length); i++) {
		const aSegment = aSegments[i];
		const bSegment = bSegments[i];

		if (aSegment === undefined || bSegment === undefined || aSegment === bSegment) {
			continue;
		}

		const aIsFolder = i + 1 < aSegments.length;
		const bIsFolder = i + 1 < bSegments.length;

		if (aIsFolder !== bIsFolder) {
			return aIsFolder ? -1 : 1;
		}

		return planPathCollator.compare(aSegment, bSegment);
	}

	return aSegments.length - bSegments.length;
};

export const renderPlan = (plan: InitPlan): string => {
	return [...plan.entries]
		.sort((a, b) => {
			return comparePlanPaths(a.path, b.path);
		})
		.map((entry) => {
			const mark = styleText(PLAN_MARK_COLOURS[entry.action], PLAN_MARKS[entry.action]);

			return `${mark} ${renderPath(entry.path)}`;
		})
		.join('\n');
};

export const planActionCounts = (plan: InitPlan): Record<'create' | 'update' | 'delete', number> => {
	return {
		create: plan.entries.filter((entry) => {
			return entry.action === 'create';
		}).length,
		update: plan.entries.filter((entry) => {
			return entry.action === 'update';
		}).length,
		delete: plan.entries.filter((entry) => {
			return entry.action === 'delete';
		}).length
	};
};

export const renderPlanHeading = (plan: InitPlan, projectName: string): string => {
	const actionCounts = planActionCounts(plan);

	const counts = (['create', 'update', 'delete'] as const).flatMap((action) => {
		const count = actionCounts[action];

		return count === 0 ? [] : [styleText(PLAN_MARK_COLOURS[action], `${count} ${PLAN_COUNT_LABELS[action]}`)];
	});

	return `Changes in ${projectName}: ${counts.join('; ')}`;
};
