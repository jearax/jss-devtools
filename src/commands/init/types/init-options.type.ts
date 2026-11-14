import type { PackageManagerName } from '@/commands/init/templates/package-json.template';

export type InitFramework = 'node' | 'react' | 'rn' | 'next' | 'nest';

export type InitOptions = {
	yes?: true;
	dryRun?: true;
	pm?: PackageManagerName;
	force?: true;
	monorepo?: true;
	framework?: InitFramework;
	sample?: boolean;
	vscode?: boolean;
	harness?: boolean;
	agentKit?: true;
	shareKnowledge?: true;
};
