import { styleText } from 'node:util';

import { intro, outro } from '@clack/prompts';

import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';
import { renderCheckList } from '@/core/ui/check-list.ui';
import { readConfig } from '@/modules/harness/services/config.service';

import { collectHealth, issueRows, summaryRows } from './services/doctor.service';

export const runHarnessDoctor = async (): Promise<void> => {
	const root = process.cwd();

	intro(styleText('inverse', ` ${PACKAGE.name} harness doctor `));

	const { config } = readConfig(root);
	const issues = await collectHealth(root);

	renderCheckList([...(await summaryRows(root, config, issues)), ...issueRows(issues)]);

	const errors = issues.filter((issue) => {
		return issue.level === 'error';
	}).length;

	if (errors > 0) {
		throw new CliError(`${errors} harness error(s)`);
	}

	outro('Harness is healthy');
};
