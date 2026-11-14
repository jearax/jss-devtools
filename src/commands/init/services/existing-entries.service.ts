import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CONFIG_NAMES } from '@/commands/init/constants/config-name.constant';
import { commitlintConfigMjsTemplate } from '@/commands/init/templates/commitlint-config-mjs.template';
import { editorconfigTemplate } from '@/commands/init/templates/editorconfig.template';
import { eslintConfigMjsTemplate } from '@/commands/init/templates/eslint-config-mjs.template';
import { gitignoreTemplate } from '@/commands/init/templates/gitignore.template';
import { huskyCommitMsgTemplate } from '@/commands/init/templates/husky-commit-msg.template';
import { huskyPreCommitTemplate } from '@/commands/init/templates/husky-pre-commit.template';
import { pnpmWorkspaceYamlExistingTemplate } from '@/commands/init/templates/pnpm-workspace-yaml.template';
import { prettierignoreTemplate } from '@/commands/init/templates/prettierignore.template';
import { prettierrcJsonTemplate } from '@/commands/init/templates/prettierrc-json.template';
import { vscodeExtensionsJsonTemplate } from '@/commands/init/templates/vscode-extensions-json.template';
import { vscodeSettingsJsonTemplate } from '@/commands/init/templates/vscode-settings-json.template';

import { mergeHook, mergeLines, mergePackageJson, mergePnpmWorkspaceYaml } from './merge.service';
import { hookCommands } from './shared-toolchain-plan.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPreflight, PlanEntry } from '@/commands/init/types/init-plan.type';

export const readIfExists = (dir: string, name: string): string | null => {
	const full = join(dir, name);

	return existsSync(full) ? readFileSync(full, 'utf8') : null;
};

const OWNED_TARGETS = new Set<string>(['eslint.config.mjs', '.prettierrc.json', 'commitlint.config.mjs']);

export const existingModeEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
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
