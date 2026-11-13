import { appPackageJsonTemplate } from '@/commands/init/templates/app-package-json.template';
import { appTsconfigJsonTemplate } from '@/commands/init/templates/app-tsconfig-json.template';
import { eslintConfigMjsTemplate } from '@/commands/init/templates/eslint-config-mjs.template';
import { monorepoPackageJsonTemplate } from '@/commands/init/templates/monorepo-package-json.template';
import { pnpmWorkspaceYamlMonorepoTemplate } from '@/commands/init/templates/pnpm-workspace-yaml.template';
import { srcMainTemplate } from '@/commands/init/templates/src-main.template';
import { tsconfigBaseJsonTemplate } from '@/commands/init/templates/tsconfig-base-json.template';
import { turboJsonTemplate } from '@/commands/init/templates/turbo-json.template';
import { PACKAGE } from '@/core/constants/package.constant';

import { nestMonorepoAppEntries } from './nest-plan.service';
import { derivePackageName } from './plan.service';
import { sharedToolchainEntries } from './shared-toolchain-plan.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPreflight, PlanEntry } from '@/commands/init/types/init-plan.type';

export const monorepoCreateModeEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	const { pm, projectName, pmVersion } = preflight;
	const packageName = derivePackageName(projectName);
	const framework = options.framework ?? 'node';

	const at = (path: string, content: string): PlanEntry => {
		return {
			action: 'create',
			path,
			content
		};
	};

	const appEntries =
		framework === 'nest'
			? nestMonorepoAppEntries(preflight, options)
			: [
					at(`apps/${framework}/package.json`, appPackageJsonTemplate({ appName: `@${packageName}/${framework}` })),
					at(`apps/${framework}/tsconfig.json`, appTsconfigJsonTemplate()),
					at(`apps/${framework}/src/main.ts`, srcMainTemplate({ projectName }))
				];

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
		...sharedToolchainEntries(pm, options.vscode, {
			eslintConfig: eslintConfigMjsTemplate({ monorepo: true }),
			pnpmWorkspaceYaml: pnpmWorkspaceYamlMonorepoTemplate()
		}),
		...appEntries,
		at('packages/.gitkeep', '')
	];

	return entries;
};
