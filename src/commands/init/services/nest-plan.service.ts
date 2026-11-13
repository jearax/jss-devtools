import { NEST_TEMPLATE_FILES } from '@/commands/init/constants/nest-template.constant';
import { NODE_PRESET_DEPENDENCIES } from '@/commands/init/constants/node-preset-dependency.constant';

import { derivePackageName } from './plan.service';
import { sharedToolchainEntries } from './shared-toolchain-plan.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPreflight, PlanEntry } from '@/commands/init/types/init-plan.type';

const NEST_TEMPLATE_PACKAGE_JSON = 'package.json';
const NEST_APP_FOLDER = 'nest';

type NestManifest = {
	name: string;
	devDependencies: Record<string, string>;
};

const planEntry = (path: string, content: string): PlanEntry => {
	return {
		action: 'create',
		path,
		content
	};
};

// The nest scripts run through the nest CLI (dev is `nest start --watch`, `nest build` rewrites the
// @/ paths), so the node preset's tsx runner and tsc-alias resolver have no call site in a nest app.
const NODE_ONLY_RUNTIME_TOOLS = ['tsc-alias', 'tsx'] as const;

const sharedDevDependencies = (): Record<string, string> => {
	return Object.fromEntries(
		Object.entries(NODE_PRESET_DEPENDENCIES)
			.filter(([name]) => {
				return !(NODE_ONLY_RUNTIME_TOOLS as readonly string[]).includes(name);
			})
			.map(([name, version]) => {
				return [name, `^${version}`];
			})
	);
};

const nestManifest = (packageName: string): string => {
	const raw = NEST_TEMPLATE_FILES[NEST_TEMPLATE_PACKAGE_JSON];

	if (raw === undefined) {
		throw new Error(`the embedded nest template has no ${NEST_TEMPLATE_PACKAGE_JSON}`);
	}

	const manifest = JSON.parse(raw) as NestManifest;

	return `${JSON.stringify(
		{
			...manifest,
			name: packageName,
			devDependencies: {
				...manifest.devDependencies,
				...sharedDevDependencies()
			}
		},
		null,
		'\t'
	)}\n`;
};

const nestTemplateEntries = (pathPrefix: string, packageName: string): readonly PlanEntry[] => {
	return Object.entries(NEST_TEMPLATE_FILES).map(([path, content]) => {
		return planEntry(`${pathPrefix}${path}`, path === NEST_TEMPLATE_PACKAGE_JSON ? nestManifest(packageName) : content);
	});
};

export const nestCreateModeEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	const packageName = derivePackageName(preflight.projectName);

	return [...nestTemplateEntries('', packageName), ...sharedToolchainEntries(preflight.pm, options.vscode)];
};

export const nestMonorepoAppEntries = (preflight: InitPreflight): readonly PlanEntry[] => {
	const packageName = derivePackageName(preflight.projectName);

	return nestTemplateEntries(`apps/${NEST_APP_FOLDER}/`, `@${packageName}/${NEST_APP_FOLDER}`);
};
