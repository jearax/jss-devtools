import type { PackageManagerName } from '@/commands/init/templates/package-json.template';

export const INIT_FRAMEWORKS = ['node', 'react', 'rn', 'next', 'nest'] as const;

export type InitFramework = (typeof INIT_FRAMEWORKS)[number];

export type InitOptions = {
	yes?: true;
	dryRun?: true;
	pm?: PackageManagerName;
	force?: true;
	monorepo?: true;
	framework?: readonly InitFramework[];
	sample?: boolean;
	vscode?: boolean;
	harness?: boolean;
	agentKit?: true;
};
