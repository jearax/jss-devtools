import { realpathSync } from 'node:fs';
import { relative } from 'node:path';

import { PACKAGE_MANAGERS } from '@/commands/init/templates/package-json.template';
import { gitHooksPath, gitTopLevel, gitVersion } from '@/core/adapters/git.adapter';
import { isYarnBerry, packageManagerVersion } from '@/core/adapters/package-manager.adapter';
import { CliError } from '@/core/errors/cli.error';
import { shellQuote } from '@/core/utils/shell-quote.util';

import type { PackageManagerName } from '@/commands/init/templates/package-json.template';
import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPreflight, PreflightFolderChecks } from '@/commands/init/types/init-plan.type';

const SUPPORTED_AGENTS = new Set<string>(PACKAGE_MANAGERS);

const SUPPORTED_LIST = PACKAGE_MANAGERS.map((pm) => {
	return pm === 'yarn' ? 'yarn 1' : pm;
}).join(', ');

const HUSKY_HOOKS_PATHS = new Set<string>(['.husky/_', '.husky']);

export const ensureGitInstalled = async (): Promise<void> => {
	const git = await gitVersion();

	if (git.status !== 'ok') {
		const hint = git.status === 'missing' ? 'Install git, then rerun' : undefined;

		throw new CliError(git.problem, hint === undefined ? {} : { hint });
	}
};

export const installedVersion = async (pm: PackageManagerName, cwd: string, create: boolean): Promise<string> => {
	const version = await packageManagerVersion(pm, cwd);

	if (version === null) {
		throw create
			? new CliError(`Package manager ${pm} is not installed`, {
					hint: 'Install it, or pick another with --pm'
				})
			: new CliError(`This project uses ${pm}, which is not installed`, {
					hint: `Install ${pm}, then rerun`
				});
	}

	return version;
};

// git prints the resolved path; cwd can sit behind a symlink, so compare resolved paths.
export const ensureGitRoot = async (cwd: string): Promise<void> => {
	const top = await gitTopLevel(cwd);

	if (top === null) {
		throw new CliError('Not a git repository', {
			label: 'To set one up',
			commands: ['git init']
		});
	}

	throw new CliError('This is not the git root', {
		label: 'To run it there',
		commands: [`cd ${shellQuote(relative(realpathSync(cwd), top))}`, 'jss-devtools init']
	});
};

export const ensureHuskyHooksPath = async (cwd: string): Promise<void> => {
	const hooksPath = await gitHooksPath(cwd);

	if (hooksPath !== null && !HUSKY_HOOKS_PATHS.has(hooksPath)) {
		throw new CliError(`Git hooks are managed by ${hooksPath} (core.hooksPath)`, {
			label: 'To use husky',
			commands: ['git config --unset core.hooksPath']
		});
	}
};

export const pmOf = (folder: PreflightFolderChecks): PackageManagerName => {
	if (folder.detected !== null && !SUPPORTED_AGENTS.has(folder.detected.agent)) {
		throw new CliError(`Package manager ${folder.detected.agent} is not supported`, {
			hint: `Supported: ${SUPPORTED_LIST}`
		});
	}

	return (folder.detected === null ? 'npm' : folder.detected.name) as PackageManagerName;
};

export const completeCreate = async (folder: PreflightFolderChecks, options: InitOptions): Promise<InitPreflight> => {
	const pm = options.pm ?? 'npm';
	const pmVersion = await installedVersion(pm, process.cwd(), true);

	if (isYarnBerry(pm, pmVersion)) {
		throw new CliError(`Only yarn 1 is supported, found yarn ${pmVersion}`, {
			hint: 'Pick another with --pm'
		});
	}

	return {
		mode: folder.mode,
		targetDir: folder.targetDir,
		projectName: folder.projectName,
		pm,
		pmVersion
	};
};
