import { appPackageJsonTemplate } from '@/commands/init/templates/app-package-json.template';
import { appTsconfigJsonTemplate } from '@/commands/init/templates/app-tsconfig-json.template';
import { commitlintConfigMjsTemplate } from '@/commands/init/templates/commitlint-config-mjs.template';
import { editorconfigTemplate } from '@/commands/init/templates/editorconfig.template';
import { eslintConfigMjsTemplate } from '@/commands/init/templates/eslint-config-mjs.template';
import { gitignoreTemplate } from '@/commands/init/templates/gitignore.template';
import { huskyCommitMsgTemplate } from '@/commands/init/templates/husky-commit-msg.template';
import { huskyPreCommitTemplate } from '@/commands/init/templates/husky-pre-commit.template';
import { monorepoPackageJsonTemplate } from '@/commands/init/templates/monorepo-package-json.template';
import { pnpmWorkspaceYamlMonorepoTemplate } from '@/commands/init/templates/pnpm-workspace-yaml.template';
import { prettierignoreTemplate } from '@/commands/init/templates/prettierignore.template';
import { prettierrcJsonTemplate } from '@/commands/init/templates/prettierrc-json.template';
import { srcMainTemplate } from '@/commands/init/templates/src-main.template';
import { tsconfigBaseJsonTemplate } from '@/commands/init/templates/tsconfig-base-json.template';
import { turboJsonTemplate } from '@/commands/init/templates/turbo-json.template';
import { vscodeExtensionsJsonTemplate } from '@/commands/init/templates/vscode-extensions-json.template';
import { vscodeSettingsJsonTemplate } from '@/commands/init/templates/vscode-settings-json.template';
import { PACKAGE } from '@/core/constants/package.constant';

import { hookCommands, derivePackageName } from './plan.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPreflight, PlanEntry } from '@/commands/init/types/init-plan.type';

export const monorepoCreateModeEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	const { pm, projectName, pmVersion } = preflight;
	const packageName = derivePackageName(projectName);
	const framework = options.framework ?? 'node';
	const commands = hookCommands(pm);

	const at = (path: string, content: string): PlanEntry => {
		return {
			action: 'create',
			path,
			content
		};
	};

	const entries = [
		at(
			'package.json',
			monorepoPackageJsonTemplate({
				projectName: packageName,
				packageManager: pm,
				packageManagerVersion: pmVersion,
				nodeFloor: PACKAGE.nodeFloor
			})
		),
		at('turbo.json', turboJsonTemplate()),
		at('tsconfig.base.json', tsconfigBaseJsonTemplate()),
		at('eslint.config.mjs', eslintConfigMjsTemplate({ monorepo: true })),
		at('.prettierrc.json', prettierrcJsonTemplate()),
		at('.editorconfig', editorconfigTemplate()),
		at('.gitignore', gitignoreTemplate()),
		at('.prettierignore', prettierignoreTemplate()),
		at('commitlint.config.mjs', commitlintConfigMjsTemplate()),
		at('.husky/pre-commit', huskyPreCommitTemplate({ command: commands.preCommit })),
		at('.husky/commit-msg', huskyCommitMsgTemplate({ command: commands.commitMsg })),
		at(`apps/${framework}/package.json`, appPackageJsonTemplate({ appName: `@${packageName}/${framework}` })),
		at(`apps/${framework}/tsconfig.json`, appTsconfigJsonTemplate()),
		at(`apps/${framework}/src/main.ts`, srcMainTemplate({ projectName })),
		at('packages/.gitkeep', '')
	];

	if (options.vscode !== false) {
		entries.push(
			at('.vscode/settings.json', vscodeSettingsJsonTemplate({ packageManager: pm })),
			at('.vscode/extensions.json', vscodeExtensionsJsonTemplate())
		);
	}

	if (pm === 'pnpm') {
		entries.push(at('pnpm-workspace.yaml', pnpmWorkspaceYamlMonorepoTemplate()));
	}

	return entries;
};
