import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';
import { HARNESS_CONFIG } from '@/modules/harness/constants/harness-paths.constant';

import { usesAgentKit } from './agent-kit.service';
import { resolveKnowledgeShare } from './config-merge.service';
import { harnessRecordedFiles, harnessSeedRefreshes } from './install-plan.service';
import { readBaseCopy, readLiveFile } from './update-manifest.service';

import type { HarnessRelease } from '@/modules/harness/types/update.type';

export const INSTALL_COMMAND_LINE = 'curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh';

const isNumeric = (part: string): boolean => {
	return /^\d+$/.test(part);
};

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+(?:\.[0-9A-Za-z.-]+)*))?$/;

const coreOf = (version: string): { core: number[]; pre: string[] | null } | null => {
	const match = SEMVER.exec(version);

	if (match === null) {
		return null;
	}

	return {
		core: [Number(match[1]), Number(match[2]), Number(match[3])],
		pre: match[4] === undefined ? null : match[4].split('.')
	};
};

const preReleaseOrder = (a: string | number, b: string | number): number => {
	if (typeof a === 'number' && typeof b === 'number') {
		return Math.sign(a - b);
	}

	if (typeof a === 'number') {
		return -1;
	}

	if (typeof b === 'number') {
		return 1;
	}

	return a < b ? -1 : a > b ? 1 : 0;
};

export const parseHarnessVersion = (version: string): boolean => {
	return SEMVER.test(version);
};

export const compareHarnessVersions = (left: string, right: string): number => {
	const leftParts = coreOf(left);
	const rightParts = coreOf(right);

	if (leftParts === null || rightParts === null) {
		throw new CliError(
			`A harness version is not semver (${leftParts === null ? left : right}); restore the harness core from git`,
			{ hint: 'Restore .harness/core from git, then rerun' }
		);
	}

	const core = leftParts.core
		.map((part, index) => {
			return Math.sign(part - (rightParts.core[index] ?? 0));
		})
		.find((order) => {
			return order !== 0;
		});

	if (core !== undefined) {
		return core;
	}

	if (leftParts.pre === null && rightParts.pre === null) {
		return 0;
	}

	if (leftParts.pre === null) {
		return 1;
	}

	if (rightParts.pre === null) {
		return -1;
	}

	const longest = Math.max(leftParts.pre.length, rightParts.pre.length);

	for (let index = 0; index < longest; index += 1) {
		const a = leftParts.pre[index];
		const b = rightParts.pre[index];

		if (a === undefined) {
			return -1;
		}

		if (b === undefined) {
			return 1;
		}

		const order = preReleaseOrder(isNumeric(a) ? Number(a) : a, isNumeric(b) ? Number(b) : b);

		if (order !== 0) {
			return order;
		}
	}

	return 0;
};

export const harnessRelease = (root: string): HarnessRelease => {
	const agentKit = usesAgentKit(root);

	const share = resolveKnowledgeShare(readBaseCopy(root, HARNESS_CONFIG), readLiveFile(root, HARNESS_CONFIG) ?? '{}');

	return {
		version: PACKAGE.version,
		files: harnessRecordedFiles(agentKit, share),
		seeds: harnessSeedRefreshes()
	};
};
