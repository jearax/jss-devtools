import { createHash } from 'node:crypto';

import { PACKAGE } from '@/core/constants/package.constant';
import {
	CLAUDE_MD,
	CLAUDE_SETTINGS,
	CLAUDE_SKILLS_DIR,
	HARNESS_BASE_DIR,
	HARNESS_CONFIG,
	HARNESS_DECISIONS_DIR,
	HARNESS_DIR,
	HARNESS_DOCS_DIR,
	HARNESS_MANIFEST,
	HARNESS_PLANS_DIR,
	HARNESS_TEMPLATES_DIR
} from '@/modules/harness/constants/harness-paths.constant';
import { harnessHookBundle } from '@/modules/harness/constants/hook-bundle.constant';
import { harnessBootstrapTemplate } from '@/modules/harness/templates/bootstrap.template';
import { harnessClaudeBlockTemplate } from '@/modules/harness/templates/claude-block.template';
import { harnessConfigTemplate } from '@/modules/harness/templates/harness-config.template';
import {
	harnessGitignoreTemplate,
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

export type HarnessFileKind = 'managed' | 'seed' | 'block' | 'config' | 'merge' | 'cli';

export type HarnessInstallEntry = {
	path: string;
	kind: HarnessFileKind;
	content: string;
};

export type HarnessInstallInput = {
	mode: 'create' | 'existing';
	agentKit: boolean;
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

const sha256 = (text: string): string => {
	return createHash('sha256').update(text, 'utf8').digest('hex');
};

const OWNED_FILES = (input: HarnessInstallInput): readonly OwnedFile[] => {
	const block = harnessClaudeBlockTemplate;

	const skills = [
		at(`${CLAUDE_SKILLS_DIR}/harness-onboard/SKILL.md`, 'managed', harnessOnboardSkillTemplate),
		at(`${CLAUDE_SKILLS_DIR}/harness-review/SKILL.md`, 'managed', harnessReviewSkillTemplate),
		at(`${CLAUDE_SKILLS_DIR}/harness-curate/SKILL.md`, 'managed', harnessCurateSkillTemplate)
	];

	return [
		at(`${HARNESS_DIR}/.gitignore`, 'managed', harnessGitignoreTemplate),
		at(`${HARNESS_DIR}/MEMORY.md`, 'seed', harnessMemoryTemplate),
		at(`${HARNESS_DIR}/BOOTSTRAP.md`, 'seed', harnessBootstrapTemplate(input.mode)),
		at(HARNESS_CONFIG, 'config', harnessConfigTemplate()),
		at(`${HARNESS_DECISIONS_DIR}/README.md`, 'seed', harnessDecisionsReadmeTemplate),
		at(`${HARNESS_DOCS_DIR}/README.md`, 'seed', harnessDocsReadmeTemplate),
		at(`${HARNESS_PLANS_DIR}/README.md`, 'managed', harnessPlansReadmeTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/README.md`, 'managed', harnessTemplatesReadmeTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/decision.md`, 'managed', harnessDecisionTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/skill.md`, 'managed', harnessSkillTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/plan.md`, 'managed', harnessPlanTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/docs/topic.md`, 'managed', harnessDocsTopicTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/docs/architecture.md`, 'managed', harnessDocsArchitectureTemplateTemplate),
		at(`${HARNESS_TEMPLATES_DIR}/docs/runbook.md`, 'managed', harnessDocsRunbookTemplateTemplate),
		...skills,
		at(`${HARNESS_DIR}/bin/hooks.mjs`, 'managed', harnessHookBundle),
		at(`${HARNESS_DIR}/bin/harness-hook.mjs`, 'managed', hookShimTemplate(PACKAGE.nodeFloor)),
		at(CLAUDE_MD, 'block', mergeHarnessBlock(input.claudeMd, block)),
		at(CLAUDE_SETTINGS, 'merge', mergeHarnessSettings(input.settingsJson))
	];
};

const RECORDED_KINDS = new Set<string>(['managed', 'block', 'config']);

export type HarnessRecordedFile = {
	path: string;
	kind: 'managed' | 'block' | 'config';
	content: string;
};

export const harnessRecordedFiles = (): readonly HarnessRecordedFile[] => {
	return OWNED_FILES({
		mode: 'existing',
		agentKit: false,
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

const manifestOf = (recorded: readonly HarnessRecordedFile[], version: string): string => {
	const files = recorded.map((file) => {
		return {
			path: file.path,
			kind: file.kind,
			sha256: sha256(file.content)
		};
	});

	return `${JSON.stringify(
		{
			version,
			files
		},
		null,
		'\t'
	)}\n`;
};

const baseEntriesOf = (recorded: readonly HarnessRecordedFile[]): readonly HarnessInstallEntry[] => {
	return recorded.map((file) => {
		return {
			path: `${HARNESS_BASE_DIR}/${file.path}`,
			kind: 'cli' as const,
			content: file.content
		};
	});
};

export const harnessManifestOf = (recorded: readonly HarnessRecordedFile[], version: string): string => {
	return manifestOf(recorded, version);
};

export const harnessBaseEntriesOf = (recorded: readonly HarnessRecordedFile[]): readonly HarnessInstallEntry[] => {
	return baseEntriesOf(recorded);
};

export const harnessInstallEntries = (input: HarnessInstallInput): readonly HarnessInstallEntry[] => {
	const owned = OWNED_FILES(input);

	const recorded = owned
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

	const manifest = manifestOf(recorded, PACKAGE.version);

	return [
		...owned.map((file) => {
			return {
				path: file.path,
				kind: file.kind,
				content: file.content
			};
		}),
		{
			path: HARNESS_MANIFEST,
			kind: 'cli',
			content: manifest
		},
		...baseEntriesOf(recorded)
	];
};
