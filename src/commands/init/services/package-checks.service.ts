import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CONFIG_NAMES } from '@/commands/init/constants/config-name.constant';
import { CliError } from '@/core/errors/cli.error';

import { mergePnpmWorkspaceYaml } from './merge.service';

export const parsePackageJson = (cwd: string): Record<string, unknown> => {
	if (!existsSync(join(cwd, 'package.json'))) {
		throw new CliError('No package.json here', {
			label: 'To create a project',
			commands: ['jss-devtools init <project-name>']
		});
	}

	const raw = readFileSync(join(cwd, 'package.json'), 'utf8');

	try {
		return JSON.parse(raw) as Record<string, unknown>;
	} catch (error) {
		throw new CliError(`Invalid JSON in package.json: ${(error as Error).message}`, {
			hint: 'Fix it, then rerun'
		});
	}
};

// pnpm 11 writes this file for a single package too (allowBuilds placeholders), so only a top-level
// packages field says monorepo.
export const isMonorepoWorkspace = (cwd: string): boolean => {
	const path = join(cwd, 'pnpm-workspace.yaml');

	return existsSync(path) && /^packages:/m.test(readFileSync(path, 'utf8'));
};

export const ensurePnpmWorkspaceMergeable = (cwd: string): void => {
	const raw = readFileSync(join(cwd, 'pnpm-workspace.yaml'), 'utf8');

	if (mergePnpmWorkspaceYaml(raw).action === 'unmergeable') {
		throw new CliError('Cannot extend pnpm-workspace.yaml line by line', {
			hint: 'Add esbuild: true and unrs-resolver: true under allowBuilds, then rerun'
		});
	}
};

export const ownedConflicts = (cwd: string, withVscode: boolean): readonly string[] => {
	const names = [
		...CONFIG_NAMES.eslint.files,
		...CONFIG_NAMES.prettier.files,
		...CONFIG_NAMES.commitlint.files,
		'.editorconfig',
		...(withVscode ? ['.vscode/settings.json', '.vscode/extensions.json'] : [])
	];

	return [...new Set(names)].filter((name) => {
		return existsSync(join(cwd, name));
	});
};
