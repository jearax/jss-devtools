import { PACKAGE } from '@/core/constants/package.constant';
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

import type { CheckListRow } from '@/core/ui/check-list.ui';
import type { HealthContext, HealthIssue } from '@/modules/harness/types/health-issue.type';
import type { InstalledManifest } from '@/modules/harness/types/update.type';

const manifestOf = (root: string): InstalledManifest | null => {
	try {
		return readManifest(root);
	} catch {
		return null;
	}
};

const collectHealth = async (root: string): Promise<HealthIssue[]> => {
	const { config } = readConfig(root);
	const today = new Date().toISOString().slice(0, 10);
	const manifest = manifestOf(root);

	const context: HealthContext = {
		root,
		config,
		today,
		manifest
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

const summaryRows = (root: string, config: HealthContext['config']): readonly CheckListRow[] => {
	const memory = readMemoryState(root);
	const maxChars = config.memory.maxChars;
	const manifest = manifestOf(root);

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
		status: 'ok',
		detail: `${memory.size}/${maxChars ?? '?'} chars, ${memory.entries.length} entries`
	});

	rows.push({
		label: 'Decisions',
		status: 'ok',
		detail: `${decisionsInForce(root).length} decisions in force`
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
