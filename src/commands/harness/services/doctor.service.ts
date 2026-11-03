import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';
import { HARNESS_MANIFEST } from '@/modules/harness/constants/harness-paths.constant';
import { readConfig } from '@/modules/harness/services/config.service';
import { decisionsInForce } from '@/modules/harness/services/decisions.service';
import { installIssues } from '@/modules/harness/services/health-install.service';
import { akSkillIssues, learnedSkillIssues } from '@/modules/harness/services/health-skills.service';
import { stateIssues } from '@/modules/harness/services/health-state.service';
import { managedDriftIssues, stagedUpdateIssue, versionIssue } from '@/modules/harness/services/health-update.service';
import { learnedSkillNames } from '@/modules/harness/services/learned-skills.service';
import { readMemoryState } from '@/modules/harness/services/memory.service';
import { readManifest } from '@/modules/harness/services/update-manifest.service';
import { compareHarnessVersions } from '@/modules/harness/services/update-release.service';

import type { CheckListRow, CheckStatus } from '@/core/ui/check-list.ui';
import type { HealthContext, HealthIssue } from '@/modules/harness/types/health-issue.type';
import type { InstalledManifest } from '@/modules/harness/types/update.type';

const manifestOf = (root: string): { manifest: InstalledManifest | null; problem: string | null } => {
	if (!existsSync(join(root, HARNESS_MANIFEST))) {
		return {
			manifest: null,
			problem: null
		};
	}

	try {
		return {
			manifest: readManifest(root),
			problem: null
		};
	} catch (error) {
		return {
			manifest: null,
			problem: error instanceof CliError ? error.message : 'the manifest is not valid JSON'
		};
	}
};

const collectHealth = async (root: string): Promise<HealthIssue[]> => {
	const { config } = readConfig(root);
	const today = new Date().toISOString().slice(0, 10);
	const { manifest, problem } = manifestOf(root);

	const context: HealthContext = {
		root,
		config,
		today,
		manifest,
		manifestProblem: problem
	};

	return [
		...installIssues(context),
		...stateIssues(context),
		...learnedSkillIssues(root, config, today),
		...(await akSkillIssues(root)),
		...managedDriftIssues(root, manifest),
		stagedUpdateIssue(root),
		versionIssue(manifest)
	].filter((issue) => {
		return issue !== null;
	});
};

const memoryStatusOf = (issues: readonly HealthIssue[]): CheckStatus => {
	const memory = issues.filter((issue) => {
		return issue.label === 'Memory';
	});

	if (
		memory.some((issue) => {
			return issue.level === 'error';
		})
	) {
		return 'fail';
	}

	if (
		memory.some((issue) => {
			return issue.level === 'warn';
		})
	) {
		return 'info';
	}

	return 'ok';
};

const summaryRows = (
	root: string,
	config: HealthContext['config'],
	issues: readonly HealthIssue[]
): readonly CheckListRow[] => {
	const memory = readMemoryState(root);
	const maxChars = config.memory.maxChars;
	const { manifest } = manifestOf(root);

	const rows: CheckListRow[] = [];

	if (manifest !== null && compareHarnessVersions(manifest.version, PACKAGE.version) === 0) {
		rows.push({
			label: 'Version',
			status: 'ok',
			detail: manifest.version
		});
	}

	rows.push({
		label: 'Memory',
		status: memoryStatusOf(issues),
		detail: `${memory.size}/${maxChars ?? '?'} chars, ${memory.entries.length} entries`
	});

	rows.push({
		label: 'Decisions',
		status: 'ok',
		detail: String(decisionsInForce(root).length)
	});

	rows.push({
		label: 'Learned skills',
		status: 'ok',
		detail: String(learnedSkillNames(root).length)
	});

	return rows;
};

const issueRows = (issues: readonly HealthIssue[]): CheckListRow[] => {
	return issues.map((issue) => {
		const row: CheckListRow = {
			label: issue.label,
			status: issue.level === 'error' ? 'fail' : 'info',
			detail: issue.detail
		};

		if (issue.nextStep !== undefined) {
			row.note = issue.nextStep;
		}

		return row;
	});
};

export { collectHealth, issueRows, summaryRows };
