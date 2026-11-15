import { NODE_PRESET_DEPENDENCIES } from '@/commands/init/constants/node-preset-dependency.constant';

import type { PlanEntry } from '@/commands/init/types/init-plan.type';

// The nest and react scripts never run a TS file directly or resolve the @/ alias at runtime, so
// the node preset's tsx runner and tsc-alias resolver have no call site in their apps.
const NODE_ONLY_RUNTIME_TOOLS = ['tsc-alias', 'tsx'] as const;

type TemplateManifest = {
	name: string;
	devDependencies: Record<string, string>;
};

export const planEntry = (path: string, content: string): PlanEntry => {
	return {
		action: 'create',
		path,
		content
	};
};

export const sharedDevDependencies = (): Record<string, string> => {
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

export const templateManifest = (files: Record<string, string>, packageName: string, framework: string): string => {
	const raw = files['package.json'];

	if (raw === undefined) {
		throw new Error(`the embedded ${framework} template has no package.json`);
	}

	const manifest = JSON.parse(raw) as TemplateManifest;

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
