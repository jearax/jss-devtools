import { eslintConfigMjsTemplate } from '@/commands/init/templates/eslint-config-mjs.template';
import { packageJsonTemplate } from '@/commands/init/templates/package-json.template';
import { srcMainTemplate } from '@/commands/init/templates/src-main.template';
import { tsconfigJsonTemplate } from '@/commands/init/templates/tsconfig-json.template';
import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';
import { CLAUDE_MD, CLAUDE_SETTINGS } from '@/modules/harness/constants/harness-paths.constant';
import { harnessInstallEntries } from '@/modules/harness/services/install-plan.service';

import { existingModeEntries, readIfExists } from './existing-entries.service';
import { monorepoCreateModeEntries } from './monorepo-plan.service';
import { nestCreateModeEntries } from './nest-plan.service';
import { sharedToolchainEntries } from './shared-toolchain-plan.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPlan, InitPreflight, PlanEntry } from '@/commands/init/types/init-plan.type';

export { comparePlanPaths, planActionCounts, renderPlan, renderPlanHeading } from './plan-render.service';

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

const harnessEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	if (options.harness === false) {
		return [];
	}

	const claudeMd = readIfExists(preflight.targetDir, CLAUDE_MD);
	const settingsJson = readIfExists(preflight.targetDir, CLAUDE_SETTINGS);

	return harnessInstallEntries({
		mode: preflight.mode,
		agentKit: options.agentKit === true,
		shareKnowledge: options.shareKnowledge === true,
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
