import { createHash } from 'node:crypto';

import { PACKAGE } from '@/core/constants/package.constant';
import {
	CLAUDE_MD,
	CLAUDE_SETTINGS,
	CLAUDE_SKILLS_DIR,
	HARNESS_CONFIG,
	HARNESS_DECISIONS_DIR,
	HARNESS_DIR,
	HARNESS_DOCS_DIR,
	HARNESS_PLANS_DIR,
	HARNESS_TEMPLATES_DIR,
	HOOK_BUNDLE_PATH,
	HOOK_SHIM_PATH
} from '@/modules/harness/constants/harness-paths.constant';
import { harnessHookBundle } from '@/modules/harness/constants/hook-bundle.constant';
import { harnessBootstrapTemplate } from '@/modules/harness/templates/bootstrap.template';
import { harnessClaudeBlockTemplate } from '@/modules/harness/templates/claude-block.template';
import { harnessConfigTemplate } from '@/modules/harness/templates/harness-config.template';
import {
	harnessGitignoreTemplate,
	harnessSkillsGitignoreTemplate,
	harnessMemoryTemplate,
	harnessDecisionsReadmeTemplate,
	harnessDocsReadmeTemplate,
	harnessPlansReadmeTemplate
} from '@/modules/harness/templates/harness-seeds.template';
import {
	harnessCurateSkillTemplate,
	harnessOnboardSkillTemplate,
	harnessReviewSkillTemplate
} from '@/modules/harness/templates/harness-skills.template';
import {
	harnessTemplatesReadmeTemplate,
	harnessDecisionTemplateTemplate,
	harnessSkillTemplateTemplate,
	harnessPlanTemplateTemplate,
	harnessDocsTopicTemplateTemplate,
	harnessDocsArchitectureTemplateTemplate,
	harnessDocsRunbookTemplateTemplate
} from '@/modules/harness/templates/harness-template-files.template';
import { hookShimTemplate } from '@/modules/harness/templates/hook-shim.template';

import { mergeHarnessBlock, mergeHarnessSettings } from './merge.service';

import type { HarnessSeedFile } from '@/modules/harness/types/update.type';

export type HarnessFileKind = 'managed' | 'seed' | 'block' | 'config' | 'merge' | 'cli';

export type HarnessInstallEntry = {
	path: string;
	kind: HarnessFileKind;
	content: string;
};

export type HarnessInstallInput = {
	mode: 'create' | 'existing';
	agentKit: boolean;
	shareKnowledge?: boolean;
	claudeMd: string | null;
	settingsJson: string | null;
};

type OwnedFile = {
	path: string;
	kind: 'managed' | 'seed' | 'block' | 'config' | 'merge';
	content: string;
};

const at = (path: string, kind: OwnedFile['kind'], content: string): OwnedFile => {
	return {
		path,
		kind,
		content
	};
};

export const sha256 = (text: string): string => {
	return createHash('sha256').update(text, 'utf8').digest('hex');
};

/**
 * The plans README follows the AgentKit setting: the harness-only variant describes a layout the
 * harness owns, so the harness replaces it; the AgentKit variant is an index the plan skill
 * maintains, so the repository owns it and the harness writes it once.
 */
const plansReadmeKind = (agentKit: boolean): OwnedFile['kind'] => {
	return agentKit === false ? 'managed' : 'seed';
};

export const OWNED_FILES = (input: HarnessInstallInput): readonly OwnedFile[] => {
	const block = harnessClaudeBlockTemplate(input.agentKit);

	const skills = [
		...(input.shareKnowledge === true
			? []
			: [at(`${CLAUDE_SKILLS_DIR}/.gitignore`, 'managed', harnessSkillsGitignoreTemplate)]),
		at(`${CLAUDE_SKILLS_DIR}/harness-onboard/SKILL.md`, 'managed', harnessOnboardSkillTemplate),
		at(`${CLAUDE_SKILLS_DIR}/harness-review/SKILL.md`, 'managed', harnessReviewSkillTemplate),
		at(`${CLAUDE_SKILLS_DIR}/harness-curate/SKILL.md`, 'managed', harnessCurateSkillTemplate)
	];

	return [
		at(`${HARNESS_DIR}/.gitignore`, 'managed', harnessGitignoreTemplate(input.shareKnowledge === true, input.agentKit)),
		at(`${HARNESS_DIR}/MEMORY.md`, 'seed', harnessMemoryTemplate),
		at(`${HARNESS_DIR}/BOOTSTRAP.md`, 'seed', harnessBootstrapTemplate(input.mode)),
		at(HARNESS_CONFIG, 'config', harnessConfigTemplate(input.shareKnowledge === true)),
		at(`${HARNESS_DECISIONS_DIR}/README.md`, 'seed', harnessDecisionsReadmeTemplate),
		at(`${HARNESS_DOCS_DIR}/README.md`, 'seed', harnessDocsReadmeTemplate),
		at(`${HARNESS_PLANS_DIR}/README.md`, plansReadmeKind(input.agentKit), harnessPlansReadmeTemplate(input.agentKit)),
		at(`${HARNESS_TEMPLATES_DIR}/README.md`, 'managed', harnessTemplatesReadmeTemplate(input.agentKit)),
		at(`${HARNESS_TEMPLATES_DIR}/decision.md`, 'managed', harnessDecisionTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/skill.md`, 'managed', harnessSkillTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/plan.md`, 'managed', harnessPlanTemplateTemplate(input.agentKit)),
		at(`${HARNESS_TEMPLATES_DIR}/docs/topic.md`, 'managed', harnessDocsTopicTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/docs/architecture.md`, 'managed', harnessDocsArchitectureTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/docs/runbook.md`, 'managed', harnessDocsRunbookTemplateTemplate),
		...skills,
		at(HOOK_BUNDLE_PATH, 'managed', harnessHookBundle),
		at(HOOK_SHIM_PATH, 'managed', hookShimTemplate(PACKAGE.nodeFloor)),
		at(CLAUDE_MD, 'block', mergeHarnessBlock(input.claudeMd, block)),
		at(CLAUDE_SETTINGS, 'merge', mergeHarnessSettings(input.settingsJson))
	];
};

export const RECORDED_KINDS = new Set<string>(['managed', 'block', 'config']);

/**
 * The seed contents the release recognises for a path the repository owns under one setting and
 * the harness owns under the other. The update uses them to hand the file over in either
 * direction: a seed the repository has not touched takes the current content, a seed the
 * repository has written keeps what it wrote.
 */
export const harnessSeedRefreshes = (): readonly HarnessSeedFile[] => {
	return [
		{
			path: `${HARNESS_PLANS_DIR}/README.md`,
			content: harnessPlansReadmeTemplate(true)
		}
	];
};

export type HarnessRecordedFile = {
	path: string;
	kind: 'managed' | 'block' | 'config';
	content: string;
};

export const harnessRecordedFiles = (agentKit: boolean, shareKnowledge = false): readonly HarnessRecordedFile[] => {
	return OWNED_FILES({
		mode: 'existing',
		agentKit,
		shareKnowledge,
		claudeMd: null,
		settingsJson: null
	})
		.filter((file) => {
			return RECORDED_KINDS.has(file.kind);
		})
		.map((file) => {
			return {
				path: file.path,
				kind: file.kind as 'managed' | 'block' | 'config',
				content: file.content
			};
		});
};

export { harnessManifestOf, harnessBaseEntriesOf, harnessInstallEntries } from './install-packaging.service';
