import { relative } from 'node:path';
import { styleText } from 'node:util';

import { confirm, intro, isCancel, log, outro, select } from '@clack/prompts';
import { Option } from 'commander';

import { AGENT_KIT_INIT_COMMAND_LINE, agentKitInit } from '@/core/adapters/agent-kit.adapter';
import { installPackages, localBinCommandLine, runLocalBin } from '@/core/adapters/package-manager.adapter';
import { COMMON_OPTIONS } from '@/core/constants/common-option.constant';
import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';
import { showBanner } from '@/core/ui/banner.ui';
import { examplesText } from '@/core/ui/help-examples.ui';
import {
	createTaskLog,
	isInteractive,
	nextStepBlock,
	nextStepLines,
	runTasks,
	taskLogSummary
} from '@/core/ui/terminal.ui';
import { applyCommandLineOf } from '@/core/utils/apply-command-line.util';
import { shellQuote } from '@/core/utils/shell-quote.util';

import { validateInitArguments } from './services/init.service';
import { buildInitPlan, planActionCounts, renderPlan, renderPlanHeading } from './services/plan.service';
import { completePreflight, preflightFolderChecks } from './services/preflight.service';
import { applyInitPlan } from './services/write.service';
import { PACKAGE_MANAGERS } from './templates/package-json.template';

import type { PackageManagerName } from './templates/package-json.template';
import type { InitOptions } from './types/init-options.type';
import type { InitPreflight } from './types/init-plan.type';
import type { Command } from 'commander';

const DIR_DESCRIPTION = 'Folder for a new project (missing or empty); omit it to set up the current folder';

const PM_CHOICES = PACKAGE_MANAGERS;

const PM_QUESTION_ORDER = [...PACKAGE_MANAGERS].reverse();

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['jss-devtools init my-app', 'Create my-app, asking for the package manager'],
	['jss-devtools init my-app --pm pnpm -y', 'Create my-app with pnpm, no questions (CI)'],
	['jss-devtools init my-api --framework nest -y', 'Create my-api as a Nest 12 app'],
	['jss-devtools init my-api --framework nest --no-sample -y', 'Create it without the example domain'],
	['jss-devtools init my-app --monorepo', 'Create my-app as a Turborepo monorepo'],
	['jss-devtools init', 'Set up the project in the current folder'],
	['jss-devtools init -f', 'Replace existing ESLint, Prettier and commitlint configs'],
	['jss-devtools init --no-harness', 'Set up the toolchain without the harness'],
	['jss-devtools init --dry-run', 'Show what would change, write nothing']
];

// Shows `default: "npm"` in help without a parsed default: --pm must stay undefined when it is
// not passed, so the question runs and the no-folder check still errors.
const pmOption = new Option('--pm <name>', 'Package manager for a new project')
	.choices([...PM_CHOICES])
	.default(undefined, 'npm');

export const registerInitCommand = (program: Command): void => {
	program
		.command('init')
		.description('Create a project, or set up the current one')
		.argument('[dir]', DIR_DESCRIPTION)
		.addOption(
			new Option('--framework <name>', 'Preset to apply')
				.choices(['node', 'react', 'rn', 'next', 'nest'])
				.default('node')
		)
		.addOption(pmOption)
		.option('--monorepo', 'Create a Turborepo with the app under apps/<framework> (default: off)')
		.option(
			'--force, -f',
			'Replace existing ESLint, Prettier, commitlint and editor configs (init stops and lists them; default: off)'
		)
		.option('--no-vscode', 'Do not write .vscode/ (default: written)')
		.option('--no-sample', 'Do not write the example domain (default: written)')
		.option('--no-harness', 'Do not install the harness (default: installed)')
		.option('--agent-kit', 'Point AgentKit at .harness/docs and .harness/plans; needs ak (default: off)')
		.option(COMMON_OPTIONS.yes.flags, COMMON_OPTIONS.yes.description)
		.option(COMMON_OPTIONS.dryRun.flags, COMMON_OPTIONS.dryRun.description)
		.addHelpText('after', examplesText(EXAMPLE_ROWS))
		.action(runInit);
};

const askPackageManager = async (dirGiven: boolean, options: InitOptions): Promise<PackageManagerName | undefined> => {
	if (!dirGiven) {
		return undefined;
	}

	if (options.pm !== undefined) {
		return options.pm;
	}

	if (options.yes === true || options.dryRun === true) {
		return 'npm';
	}

	const chosen = await select<PackageManagerName>({
		message: 'Which package manager?',
		options: PM_QUESTION_ORDER.map((pm) => {
			return {
				value: pm,
				label: pm
			};
		}),
		initialValue: 'npm'
	});

	if (isCancel(chosen)) {
		throw new CliError('Cancelled, nothing written');
	}

	return chosen;
};

const withPm = (options: InitOptions, pm: PackageManagerName | undefined): InitOptions => {
	return pm === undefined
		? options
		: {
				...options,
				pm
			};
};

const nextStepCommands = (preflight: InitPreflight, relativeTarget: string, command: string): string[] => {
	const cd = preflight.mode === 'create' && relativeTarget !== '' ? [`cd ${shellQuote(relativeTarget)}`] : [];

	return [...cd, command];
};

const binFailureMessage = (action: string, bin: string, result: { stdout: string; stderr: string }): string => {
	const output = result.stderr.trim() || result.stdout.trim();

	return output === ''
		? `Could not ${action} with ${bin}; the files are written`
		: `Could not ${action} with ${bin}; the files are written\n${output}`;
};

export const sortFailureMessage = (bin: string, result: { stdout: string; stderr: string }): string => {
	return binFailureMessage('sort package.json', bin, result);
};

const formatFailureMessage = (result: { stdout: string; stderr: string }): string => {
	return binFailureMessage('format', 'prettier', result);
};

const PRETTIER_EXTENSIONS = /\.(?:[cm]?[jt]sx?|json|jsonc|md|markdown|ya?ml)$/;

export const prettierPaths = (entries: readonly { action: string; path: string; content?: string }[]): string[] => {
	return entries
		.filter((entry) => {
			return entry.action !== 'delete' && entry.content !== undefined && PRETTIER_EXTENSIONS.test(entry.path);
		})
		.map((entry) => {
			return entry.path;
		});
};

const sortPackageJson = async (
	preflight: InitPreflight,
	relativeTarget: string,
	cwd: string,
	manifests: readonly string[]
): Promise<void> => {
	for (const manifest of manifests) {
		for (const bin of ['prettier-package-json', 'prettier'] as const) {
			const args = ['--write', manifest];

			const result = await runLocalBin(preflight.pm, bin, args, cwd);

			if (result.code !== 0) {
				throw new CliError(sortFailureMessage(bin, result), {
					commands: nextStepCommands(preflight, relativeTarget, localBinCommandLine(preflight.pm, bin, args))
				});
			}
		}
	}
};

const formatWrittenFiles = async (
	preflight: InitPreflight,
	relativeTarget: string,
	cwd: string,
	paths: readonly string[]
): Promise<void> => {
	if (paths.length === 0) {
		return;
	}

	const args = ['--write', ...paths];

	const result = await runLocalBin(preflight.pm, 'prettier', args, cwd);

	if (result.code !== 0) {
		throw new CliError(formatFailureMessage(result), {
			commands: nextStepCommands(preflight, relativeTarget, localBinCommandLine(preflight.pm, 'prettier', args))
		});
	}
};

const installError = (preflight: InitPreflight, relativeTarget: string): CliError => {
	return new CliError('Install failed; the files are written', {
		commands: nextStepCommands(preflight, relativeTarget, `${preflight.pm} install`)
	});
};

const runInit = async (dirArg: string | undefined, options: InitOptions, command: Command): Promise<void> => {
	showBanner();
	intro(styleText('inverse', ` ${PACKAGE.name} init `));

	const positional = dirArg === undefined ? [] : [dirArg];

	validateInitArguments(positional, options);

	if (options.dryRun !== true && options.yes !== true && !isInteractive()) {
		throw new CliError('Not a terminal', {
			hint: 'Run it in a terminal, or pass --yes'
		});
	}

	const folder = await preflightFolderChecks(process.cwd(), positional, options);
	const pm = await askPackageManager(folder.mode === 'create', options);
	const preflight = await completePreflight(folder, withPm(options, pm));
	const relativeTarget = relative(process.cwd(), preflight.targetDir);
	const plan = buildInitPlan(preflight, withPm(options, pm));

	if (plan.entries.length === 0) {
		outro(`Nothing to change in ${preflight.projectName}`);

		return;
	}

	log.step(renderPlanHeading(plan, preflight.projectName));
	log.message(renderPlan(plan), { spacing: 0 });

	if (options.dryRun === true && options.pm === undefined && plan.mode === 'create') {
		log.message('Assumed npm for this plan; pass --pm to pick another');
	}

	if (options.dryRun === true) {
		outro(['Dry run: nothing written', ...nextStepBlock('To apply', [applyCommandLineOf(command)])].join('\n'));

		return;
	}

	if (options.yes !== true) {
		const actionCounts = planActionCounts(plan);
		const writeCount = actionCounts.create + actionCounts.update;
		const deleteCount = actionCounts.delete;

		const files = (count: number): string => {
			return count === 1 ? 'file' : 'files';
		};

		const message =
			writeCount === 0 && deleteCount > 0
				? `Delete ${deleteCount} ${files(deleteCount)} in ${preflight.projectName} and install?`
				: deleteCount === 0
					? `Write ${writeCount} ${files(writeCount)} to ${preflight.projectName} and install?`
					: `Write ${writeCount} ${files(writeCount)}; delete ${deleteCount} in ${preflight.projectName} and install?`;

		const confirmed = await confirm({
			message,
			initialValue: true
		});

		if (isCancel(confirmed) || confirmed !== true) {
			throw new CliError('Cancelled, nothing written');
		}
	}

	await applyInitPlan(plan);

	const startedAt = Date.now();
	const installLog = createTaskLog(`Installing with ${preflight.pm}`);

	const code = await installPackages(preflight.pm, plan.targetDir, (line) => {
		installLog.message(line);
	});

	if (code !== 0) {
		installLog.error();

		throw installError(preflight, relativeTarget);
	}

	installLog.success(taskLogSummary(`Installed with ${preflight.pm}`, (Date.now() - startedAt) / 1000));

	const manifests = plan.entries
		.map((entry) => {
			return entry.path;
		})
		.filter((path) => {
			return path === 'package.json' || path.endsWith('/package.json');
		});

	const formatPaths = prettierPaths(plan.entries).filter((path) => {
		return !manifests.includes(path);
	});

	await runTasks([
		{
			title: 'Sorting package.json',
			run: async () => {
				await sortPackageJson(preflight, relativeTarget, plan.targetDir, manifests);

				return manifests.length === 1 ? 'Sorted package.json' : `Sorted ${manifests.length} package.json files`;
			}
		},
		{
			title: 'Formatting the written files',
			run: async () => {
				await formatWrittenFiles(preflight, relativeTarget, plan.targetDir, formatPaths);

				return `Formatted ${formatPaths.length} files`;
			}
		}
	]);

	if (options.harness !== false && options.agentKit === true) {
		const ok = await agentKitInit(plan.targetDir);

		if (!ok) {
			throw new CliError('AgentKit setup failed; the files are written', {
				label: 'To finish:',
				commands: nextStepCommands(preflight, relativeTarget, AGENT_KIT_INIT_COMMAND_LINE)
			});
		}
	}

	const nextCommand = preflight.mode === 'create' ? `${preflight.pm} run dev` : `${preflight.pm} run format`;

	outro(
		[
			'Next steps',
			...(options.harness !== false
				? ['     The harness is installed; open Claude Code in the project folder to onboard.']
				: []),
			...nextStepLines(nextStepCommands(preflight, relativeTarget, nextCommand))
		].join('\n')
	);
};
