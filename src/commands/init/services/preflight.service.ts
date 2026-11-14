import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { CONFIG_NAMES } from '@/commands/init/constants/config-name.constant';
import { agentKitVersion } from '@/core/adapters/agent-kit.adapter';
import { detectPackageManager } from '@/core/adapters/package-manager.adapter';
import { CliError } from '@/core/errors/cli.error';
import { shellQuote } from '@/core/utils/shell-quote.util';

import { ensureSafeHarnessEntries, ensureSettingsJsonParses, harnessConflicts } from './harness-checks.service';
import {
	isMonorepoWorkspace,
	ownedConflicts,
	parsePackageJson,
	ensurePnpmWorkspaceMergeable
} from './package-checks.service';
import {
	completeCreate,
	ensureGitInstalled,
	ensureGitRoot,
	ensureHuskyHooksPath,
	installedVersion,
	pmOf
} from './toolchain-checks.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPreflight, PreflightFolderChecks } from '@/commands/init/types/init-plan.type';

const notEmptyError = (dirArg: string): CliError => {
	return new CliError(`Folder ${dirArg} is not empty`, {
		label: 'To set it up instead',
		commands: [`cd ${shellQuote(dirArg)}`, 'jss-devtools init']
	});
};

const ensureEmptyTarget = (dirArg: string): string => {
	const target = resolve(dirArg);

	if (!existsSync(target)) {
		return target;
	}

	if (statSync(target).isFile()) {
		throw new CliError(`A file named ${dirArg} already exists`, {
			hint: 'Pick another name'
		});
	}

	if (!statSync(target).isDirectory() || readdirSync(target).length > 0) {
		throw notEmptyError(dirArg);
	}

	return target;
};

const preflightCreateFolder = async (dirArg: string): Promise<PreflightFolderChecks> => {
	const targetDir = ensureEmptyTarget(dirArg);

	await ensureGitInstalled();

	return {
		mode: 'create',
		targetDir,
		projectName: basename(targetDir),
		detected: null,
		parsed: undefined
	};
};

const preflightExistingFolder = async (cwd: string): Promise<PreflightFolderChecks> => {
	const parsed = parsePackageJson(cwd);

	if ('workspaces' in parsed || isMonorepoWorkspace(cwd)) {
		throw new CliError('Monorepos are not supported yet');
	}

	if (!existsSync(join(cwd, 'tsconfig.json'))) {
		throw new CliError('No tsconfig.json here', {
			label: 'To create a new project instead',
			commands: ['jss-devtools init <project-name>']
		});
	}

	if (!existsSync(join(cwd, '.git'))) {
		await ensureGitRoot(cwd);
	}

	await ensureHuskyHooksPath(cwd);

	const detected = await detectPackageManager(cwd);

	return {
		mode: 'existing',
		targetDir: cwd,
		projectName: basename(cwd),
		detected,
		parsed
	};
};

const completeExisting = async (folder: PreflightFolderChecks, options: InitOptions): Promise<InitPreflight> => {
	const cwd = folder.targetDir;
	const parsed = folder.parsed;
	const pm = pmOf(folder);
	const pmVersion = await installedVersion(pm, cwd, false);

	if (pm === 'pnpm' && existsSync(join(cwd, 'pnpm-workspace.yaml'))) {
		ensurePnpmWorkspaceMergeable(cwd);
	}

	const fileConflicts = ownedConflicts(cwd, options.vscode !== false);

	const harnessEnabled = options.harness !== false;

	if (harnessEnabled) {
		ensureSafeHarnessEntries(cwd);
		ensureSettingsJsonParses(cwd);
	}

	const harnessFound = harnessEnabled ? harnessConflicts(cwd) : [];

	const keyConflicts = (['eslint', 'prettier', 'commitlint'] as const).flatMap((tool) => {
		return CONFIG_NAMES[tool].packageJsonKeys
			.filter((key) => {
				return parsed !== undefined && parsed[key] !== undefined;
			})
			.map((key) => {
				return `package.json "${key}" key`;
			});
	});

	const conflicts = [...fileConflicts, ...keyConflicts, ...harnessFound];

	if (conflicts.length > 0 && options.force !== true) {
		const withVscode = conflicts.some((name) => {
			return name.startsWith('.vscode/');
		});

		const hint = withVscode ? '--no-vscode keeps .vscode/ as it is' : undefined;

		throw new CliError(`Already set up: ${conflicts.join(', ')}`, {
			label: 'To replace them',
			commands: ['jss-devtools init --force'],
			...(hint === undefined ? {} : { hint })
		});
	}

	return {
		mode: 'existing',
		targetDir: cwd,
		projectName: folder.projectName,
		pm,
		pmVersion,
		...(parsed === undefined ? {} : { packageJson: { parsed } })
	};
};

export const preflightFolderChecks = async (
	cwd: string,
	positional: readonly string[],
	options: InitOptions
): Promise<PreflightFolderChecks> => {
	const dir = positional[0];

	const agentKitCheck =
		options.agentKit === true && options.harness !== false ? await agentKitVersion() : { status: 'ok' as const };

	if (agentKitCheck.status !== 'ok') {
		throw new CliError(agentKitCheck.problem, {
			hint: 'Install ak, then rerun'
		});
	}

	return dir === undefined ? preflightExistingFolder(cwd) : preflightCreateFolder(dir);
};

export const completePreflight = async (
	folder: PreflightFolderChecks,
	options: InitOptions
): Promise<InitPreflight> => {
	return folder.mode === 'create' ? completeCreate(folder, options) : completeExisting(folder, options);
};

export const preflightInit = async (
	cwd: string,
	positional: readonly string[],
	options: InitOptions
): Promise<InitPreflight> => {
	return completePreflight(await preflightFolderChecks(cwd, positional, options), options);
};
