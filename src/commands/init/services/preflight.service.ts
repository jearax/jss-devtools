import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

import { CONFIG_NAMES } from '@/commands/init/constants/config-name.constant';
import { PACKAGE_MANAGERS } from '@/commands/init/templates/package-json.template';
import { agentKitVersion } from '@/core/adapters/agent-kit.adapter';
import { gitHooksPath, gitTopLevel, gitVersion } from '@/core/adapters/git.adapter';
import { detectPackageManager, isYarnBerry, packageManagerVersion } from '@/core/adapters/package-manager.adapter';
import { CliError } from '@/core/errors/cli.error';
import { shellQuote } from '@/core/utils/shell-quote.util';
import {
	CLAUDE_MD,
	CLAUDE_SETTINGS,
	CLAUDE_SKILLS_DIR,
	HARNESS_BLOCK_BEGIN,
	HARNESS_DIR,
	HOOK_SHIM_PATH
} from '@/modules/harness/constants/harness-paths.constant';

import { mergePnpmWorkspaceYaml } from './merge.service';

import type { PackageManagerName } from '@/commands/init/templates/package-json.template';
import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitMode, InitPreflight } from '@/commands/init/types/init-plan.type';
import type { DetectResult } from 'package-manager-detector';

export type PreflightFolderChecks = {
	mode: InitMode;
	targetDir: string;
	projectName: string;
	detected: DetectResult | null;
	parsed: Record<string, unknown> | undefined;
};

const SUPPORTED_AGENTS = new Set<string>(PACKAGE_MANAGERS);

const SUPPORTED_LIST = PACKAGE_MANAGERS.map((pm) => {
	return pm === 'yarn' ? 'yarn 1' : pm;
}).join(', ');

const HUSKY_HOOKS_PATHS = new Set<string>(['.husky/_', '.husky']);

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

const ensureGitInstalled = async (): Promise<void> => {
	const git = await gitVersion();

	if (git.status !== 'ok') {
		const hint = git.status === 'missing' ? 'Install git, then rerun' : undefined;

		throw new CliError(git.problem, hint === undefined ? {} : { hint });
	}
};

const installedVersion = async (pm: PackageManagerName, cwd: string, create: boolean): Promise<string> => {
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

const parsePackageJson = (cwd: string): Record<string, unknown> => {
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
const isMonorepoWorkspace = (cwd: string): boolean => {
	const path = join(cwd, 'pnpm-workspace.yaml');

	return existsSync(path) && /^packages:/m.test(readFileSync(path, 'utf8'));
};

const ensurePnpmWorkspaceMergeable = (cwd: string): void => {
	const raw = readFileSync(join(cwd, 'pnpm-workspace.yaml'), 'utf8');

	if (mergePnpmWorkspaceYaml(raw).action === 'unmergeable') {
		throw new CliError('Cannot extend pnpm-workspace.yaml line by line', {
			hint: 'Add esbuild: true and unrs-resolver: true under allowBuilds, then rerun'
		});
	}
};

const ownedConflicts = (cwd: string, withVscode: boolean): readonly string[] => {
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

const ensureNotSymlink = (cwd: string, name: string): void => {
	const full = join(cwd, name);

	if (existsSync(full) && lstatSync(full).isSymbolicLink()) {
		throw new CliError(`${name} is a symlink`, {
			hint: 'Replace it with a real file, then rerun'
		});
	}
};

const ensureSettingsJsonParses = (cwd: string): void => {
	const full = join(cwd, CLAUDE_SETTINGS);

	if (!existsSync(full)) {
		return;
	}

	try {
		JSON.parse(readFileSync(full, 'utf8'));
	} catch (error) {
		throw new CliError(`Invalid JSON in ${CLAUDE_SETTINGS}: ${(error as Error).message}`, {
			hint: 'Fix it, then rerun'
		});
	}
};

const harnessConflicts = (cwd: string): readonly string[] => {
	const found: string[] = [];

	if (existsSync(join(cwd, HARNESS_DIR))) {
		found.push(`${HARNESS_DIR}/`);
	}

	if (existsSync(join(cwd, CLAUDE_SKILLS_DIR))) {
		for (const entry of readdirSync(join(cwd, CLAUDE_SKILLS_DIR))) {
			if (entry.startsWith('harness-')) {
				found.push(`${CLAUDE_SKILLS_DIR}/${entry}/`);
			}
		}
	}

	const claudeMdPath = join(cwd, CLAUDE_MD);

	if (existsSync(claudeMdPath) && readFileSync(claudeMdPath, 'utf8').includes(HARNESS_BLOCK_BEGIN)) {
		found.push(`the harness block in ${CLAUDE_MD}`);
	}

	const settingsPath = join(cwd, CLAUDE_SETTINGS);

	if (existsSync(settingsPath) && readFileSync(settingsPath, 'utf8').includes(HOOK_SHIM_PATH)) {
		found.push(`harness hooks in ${CLAUDE_SETTINGS}`);
	}

	return found;
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
		const top = await gitTopLevel(cwd);

		if (top === null) {
			throw new CliError('Not a git repository', {
				label: 'To set one up',
				commands: ['git init']
			});
		}

		// git prints the resolved path; cwd can sit behind a symlink, so compare resolved paths.
		throw new CliError('This is not the git root', {
			label: 'To run it there',
			commands: [`cd ${shellQuote(relative(realpathSync(cwd), top))}`, 'jss-devtools init']
		});
	}

	const hooksPath = await gitHooksPath(cwd);

	if (hooksPath !== null && !HUSKY_HOOKS_PATHS.has(hooksPath)) {
		throw new CliError(`Git hooks are managed by ${hooksPath} (core.hooksPath)`, {
			label: 'To use husky',
			commands: ['git config --unset core.hooksPath']
		});
	}

	const detected = await detectPackageManager(cwd);

	return {
		mode: 'existing',
		targetDir: cwd,
		projectName: basename(cwd),
		detected,
		parsed
	};
};

const completeCreate = async (folder: PreflightFolderChecks, options: InitOptions): Promise<InitPreflight> => {
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

const completeExisting = async (folder: PreflightFolderChecks, options: InitOptions): Promise<InitPreflight> => {
	const cwd = folder.targetDir;
	const parsed = folder.parsed;

	if (folder.detected !== null && !SUPPORTED_AGENTS.has(folder.detected.agent)) {
		throw new CliError(`Package manager ${folder.detected.agent} is not supported`, {
			hint: `Supported: ${SUPPORTED_LIST}`
		});
	}

	const pm = (folder.detected === null ? 'npm' : folder.detected.name) as PackageManagerName;
	const pmVersion = await installedVersion(pm, cwd, false);

	if (pm === 'pnpm' && existsSync(join(cwd, 'pnpm-workspace.yaml'))) {
		ensurePnpmWorkspaceMergeable(cwd);
	}

	const fileConflicts = ownedConflicts(cwd, options.vscode !== false);

	const harnessEnabled = options.harness !== false;

	if (harnessEnabled) {
		ensureNotSymlink(cwd, CLAUDE_MD);
		ensureNotSymlink(cwd, CLAUDE_SETTINGS);
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
