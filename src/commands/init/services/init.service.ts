import { CliError } from '@/core/errors/cli.error';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitMode } from '@/commands/init/types/init-plan.type';

export const validateInitArguments = (positional: readonly string[], options: InitOptions): void => {
	const dir = positional[0];

	if (options.framework === 'nest' && dir === undefined) {
		throw new CliError('Framework nest needs <dir>', {
			hint: 'Create one with jss-devtools init <project-name> --framework nest'
		});
	}

	if (options.framework !== undefined && options.framework !== 'node' && options.framework !== 'nest') {
		throw new CliError(`Framework ${options.framework} is not supported yet`, {
			hint: 'Only node and nest are'
		});
	}

	if (options.sample === false && options.framework !== 'nest') {
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

	if (options.shareKnowledge === true && options.harness === false) {
		throw new CliError('Option --share-knowledge needs the harness', {
			hint: 'Drop --no-harness'
		});
	}
};

export const resolveInitMode = (positional: readonly string[]): InitMode => {
	return positional[0] === undefined ? 'existing' : 'create';
};
