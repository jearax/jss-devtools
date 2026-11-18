import { relative } from 'node:path';
import { styleText } from 'node:util';

import { confirm, intro, isCancel, log, outro } from '@clack/prompts';
import { InvalidArgumentError, Option } from 'commander';

import { AGENT_KIT_INIT_COMMAND_LINE, agentKitInit } from '@/core/adapters/agent-kit.adapter';
import { COMMON_OPTIONS } from '@/core/constants/common-option.constant';
import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';
import { showBanner } from '@/core/ui/banner.ui';
import { examplesText } from '@/core/ui/help-examples.ui';
import { isInteractive, nextStepBlock, nextStepLines } from '@/core/ui/terminal.ui';
import { applyCommandLineOf } from '@/core/utils/apply-command-line.util';

import { applyPlanWithInstall } from './services/init-apply.service';
import { nextStepCommands } from './services/init-format.service';
import { askPackageManager, withPm } from './services/init-prompts.service';
import { validateInitArguments } from './services/init.service';
import { buildInitPlan, planActionCounts, renderPlan, renderPlanHeading } from './services/plan.service';
import { completePreflight, preflightFolderChecks } from './services/preflight.service';
import { PACKAGE_MANAGERS } from './templates/package-json.template';
import { INIT_FRAMEWORKS } from './types/init-options.type';

import type { InitFramework, InitOptions } from './types/init-options.type';
import type { Command } from 'commander';

export { prettierPaths, sortFailureMessage } from './services/init-format.service';

const DIR_DESCRIPTION = 'Folder for a new project (missing or empty); omit it to set up the current folder';

const PM_CHOICES = PACKAGE_MANAGERS;

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['jss-devtools init my-app', 'Create my-app, asking for the package manager'],
	['jss-devtools init my-app --pm pnpm -y', 'Create my-app with pnpm, no questions (CI)'],
	['jss-devtools init my-api --framework nest -y', 'Create my-api as a Nest 12 app'],
	['jss-devtools init my-api --framework nest --no-sample -y', 'Create it without the example domain'],
	['jss-devtools init my-web --framework react -y', 'Create my-web as a Vite React app'],
	['jss-devtools init my-app --monorepo', 'Create my-app as a Turborepo monorepo'],
	['jss-devtools init my-app --monorepo --framework nest,react', 'Create it with apps/nest and apps/react'],
	['jss-devtools init my-app --monorepo --framework nest --framework react', 'The same, repeating the flag'],
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

const isInitFramework = (value: string): value is InitFramework => {
	return (INIT_FRAMEWORKS as readonly string[]).includes(value);
};

// Repeated (`--framework nest --framework react`) and comma-separated (`nest,react`) values
// accumulate into one list; duplicates are left for validateInitArguments to reject by name.
const collectFrameworks = (value: string, previous: readonly InitFramework[] | undefined): InitFramework[] => {
	const parsed = value.split(',').map((name) => {
		const trimmed = name.trim();

		if (!isInitFramework(trimmed)) {
			throw new InvalidArgumentError(`Allowed choices are ${INIT_FRAMEWORKS.join(', ')}.`);
		}

		return trimmed;
	});

	return [...(previous ?? []), ...parsed];
};

// Like --pm: undefined when not passed, `default: "node"` in help only.
const frameworkOption = new Option(
	'--framework <name>',
	'Preset to apply; with --monorepo, several: nest,react or a repeated flag'
)
	.choices([...INIT_FRAMEWORKS])
	.argParser(collectFrameworks)
	.default(undefined, 'node');

export const registerInitCommand = (program: Command): void => {
	program
		.command('init')
		.description('Create a project, or set up the current one')
		.argument('[dir]', DIR_DESCRIPTION)
		.addOption(frameworkOption)
		.addOption(pmOption)
		.option('--monorepo', 'Create a Turborepo with each framework under apps/<framework> (default: off)')
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

export const runInit = async (dirArg: string | undefined, options: InitOptions, command: Command): Promise<void> => {
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

	await applyPlanWithInstall(plan, preflight, relativeTarget);

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
