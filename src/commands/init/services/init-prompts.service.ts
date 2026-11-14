import { PACKAGE_MANAGERS } from '@/commands/init/templates/package-json.template';
import { selectOption } from '@/core/ui/select-prompt.ui';

import type { PackageManagerName } from '@/commands/init/templates/package-json.template';
import type { InitOptions } from '@/commands/init/types/init-options.type';

const PM_QUESTION_ORDER = [...PACKAGE_MANAGERS].reverse();

export const askPackageManager = async (
	dirGiven: boolean,
	options: InitOptions
): Promise<PackageManagerName | undefined> => {
	if (!dirGiven) {
		return undefined;
	}

	if (options.pm !== undefined) {
		return options.pm;
	}

	if (options.yes === true || options.dryRun === true) {
		return 'npm';
	}

	return selectOption<PackageManagerName>(
		'Which package manager?',
		PM_QUESTION_ORDER.map((pm) => {
			return [pm, pm] as const;
		}),
		'npm'
	);
};

export const withPm = (options: InitOptions, pm: PackageManagerName | undefined): InitOptions => {
	return pm === undefined
		? options
		: {
				...options,
				pm
			};
};
