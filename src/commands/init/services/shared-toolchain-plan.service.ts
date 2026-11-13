import { commitlintConfigMjsTemplate } from '@/commands/init/templates/commitlint-config-mjs.template';
import { editorconfigTemplate } from '@/commands/init/templates/editorconfig.template';
import { gitignoreTemplate } from '@/commands/init/templates/gitignore.template';
import { huskyCommitMsgTemplate } from '@/commands/init/templates/husky-commit-msg.template';
import { huskyPreCommitTemplate } from '@/commands/init/templates/husky-pre-commit.template';
import { pnpmWorkspaceYamlTemplate } from '@/commands/init/templates/pnpm-workspace-yaml.template';
import { prettierignoreTemplate } from '@/commands/init/templates/prettierignore.template';
import { prettierrcJsonTemplate } from '@/commands/init/templates/prettierrc-json.template';
import { vscodeExtensionsJsonTemplate } from '@/commands/init/templates/vscode-extensions-json.template';
import { vscodeSettingsJsonTemplate } from '@/commands/init/templates/vscode-settings-json.template';
import { localBinCommandLine } from '@/core/adapters/package-manager.adapter';

import type { PackageManagerName } from '@/commands/init/templates/package-json.template';
import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { PlanEntry } from '@/commands/init/types/init-plan.type';

export const hookCommands = (pm: PackageManagerName): { preCommit: string; commitMsg: string } => {
	return {
		preCommit: localBinCommandLine(pm, 'lint-staged', []),
		commitMsg: localBinCommandLine(pm, 'commitlint', ['--edit', '"$1"'])
	};
};

type SharedToolchainExtras = {
	readonly eslintConfig?: string;
	readonly pnpmWorkspaceYaml?: string;
};

export const sharedToolchainEntries = (
	pm: PackageManagerName,
	vscode: InitOptions['vscode'],
	extras: SharedToolchainExtras = {}
): readonly PlanEntry[] => {
	const commands = hookCommands(pm);

	const planEntry = (path: string, content: string): PlanEntry => {
		return {
			action: 'create',
			path,
			content
		};
	};

	const entries: PlanEntry[] = [];

	if (extras.eslintConfig !== undefined) {
		entries.push(planEntry('eslint.config.mjs', extras.eslintConfig));
	}

	entries.push(
		planEntry('.prettierrc.json', prettierrcJsonTemplate()),
		planEntry('.editorconfig', editorconfigTemplate()),
		planEntry('.gitignore', gitignoreTemplate()),
		planEntry('.prettierignore', prettierignoreTemplate()),
		planEntry('commitlint.config.mjs', commitlintConfigMjsTemplate()),
		planEntry('.husky/pre-commit', huskyPreCommitTemplate({ command: commands.preCommit })),
		planEntry('.husky/commit-msg', huskyCommitMsgTemplate({ command: commands.commitMsg }))
	);

	if (vscode !== false) {
		entries.push(
			planEntry('.vscode/settings.json', vscodeSettingsJsonTemplate({ packageManager: pm })),
			planEntry('.vscode/extensions.json', vscodeExtensionsJsonTemplate())
		);
	}

	if (pm === 'pnpm') {
		entries.push(planEntry('pnpm-workspace.yaml', extras.pnpmWorkspaceYaml ?? pnpmWorkspaceYamlTemplate()));
	}

	return entries;
};
