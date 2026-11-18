import { CliError } from '@/core/errors/cli.error';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitMode } from '@/commands/init/types/init-plan.type';

export const validateInitArguments = (positional: readonly string[], options: InitOptions): void => {
	const dir = positional[0];

	const frameworks = options.framework ?? [];

	const repeated = frameworks.find((framework, index) => {
		return frameworks.indexOf(framework) !== index;
	});

	if (repeated !== undefined) {
		throw new CliError(`Framework ${repeated} is listed twice`, {
			hint: 'List each framework once; each gets one apps/<framework>'
		});
	}

	if (frameworks.length > 1 && options.monorepo !== true) {
		throw new CliError('Several frameworks need --monorepo', {
			hint: `Add --monorepo, or pass one --framework`
		});
	}

	const unsupported = frameworks.find((framework) => {
		return framework !== 'node' && framework !== 'nest' && framework !== 'react';
	});

	if (unsupported !== undefined) {
		throw new CliError(`Framework ${unsupported} is not supported yet`, {
			hint: 'Only node, nest and react are'
		});
	}

	const needsDir = frameworks.find((framework) => {
		return framework === 'nest' || framework === 'react';
	});

	if (needsDir !== undefined && dir === undefined) {
		throw new CliError(`Framework ${needsDir} needs <dir>`, {
			hint: `Create one with jss-devtools init <project-name> --framework ${needsDir}`
		});
	}

	if (options.sample === false && !frameworks.includes('nest')) {
		throw new CliError('--no-sample needs --framework nest', {
			hint: 'The example domain ships only with the nest preset'
		});
	}

	if (dir === undefined && options.pm !== undefined) {
		throw new CliError('Option --pm needs <dir>', {
			hint: 'An existing project uses the manager it has'
		});
	}

	if (dir === undefined && options.monorepo === true) {
		throw new CliError('Option --monorepo needs <dir>', {
			hint: 'Create one with jss-devtools init <project-name> --monorepo'
		});
	}

	if (dir !== undefined && options.force === true) {
		throw new CliError('Option --force is for an existing project', {
			hint: 'Drop it when creating one'
		});
	}

	if (options.agentKit === true && options.harness === false) {
		throw new CliError('Option --agent-kit needs the harness', {
			hint: 'Drop --no-harness'
		});
	}
};

export const resolveInitMode = (positional: readonly string[]): InitMode => {
	return positional[0] === undefined ? 'existing' : 'create';
};
