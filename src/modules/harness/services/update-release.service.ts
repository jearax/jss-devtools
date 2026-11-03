import { PACKAGE } from '@/core/constants/package.constant';

import { usesAgentKit } from './agent-kit.service';
import { harnessRecordedFiles, harnessSeedRefreshes } from './install-plan.service';

import type { HarnessRelease } from '@/modules/harness/types/update.type';

export const INSTALL_COMMAND_LINE = 'curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh';

const numericParts = (version: string): number[] => {
	return version.split('.').map((part) => {
		return Number.parseInt(part, 10);
	});
};

export const compareHarnessVersions = (left: string, right: string): number => {
	const leftParts = numericParts(left);
	const rightParts = numericParts(right);

	for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index++) {
		const a = leftParts[index] ?? 0;
		const b = rightParts[index] ?? 0;

		if (a !== b) {
			return a - b;
		}
	}

	return 0;
};

export const harnessRelease = (root: string): HarnessRelease => {
	const agentKit = usesAgentKit(root);

	return {
		version: PACKAGE.version,
		files: harnessRecordedFiles(agentKit),
		seeds: harnessSeedRefreshes()
	};
};
