import { isCancel, select } from '@clack/prompts';

import { CliError } from '@/core/errors/cli.error';

import type { Option } from '@clack/prompts';

export const selectOption = async <T extends string>(
	message: string,
	options: ReadonlyArray<readonly [T, string]>,
	initialValue: T
): Promise<T> => {
	const chosen = await select<T>({
		message,
		options: options.map((option) => {
			return {
				value: option[0],
				label: option[1]
			};
		}) as Option<T>[],
		initialValue
	});

	if (isCancel(chosen)) {
		throw new CliError('Cancelled, nothing written');
	}

	return chosen;
};
