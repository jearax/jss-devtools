import { describe, expect, it } from 'vitest';

import { PACKAGE } from '@/core/constants/package.constant';
import { HOOK_TIMEOUT_SECONDS } from '@/modules/harness/constants/harness-limits.constant';
import {
	HARNESS_BLOCK_BEGIN,
	HARNESS_BLOCK_END,
	HOOK_COMMAND
} from '@/modules/harness/constants/harness-paths.constant';
import { harnessInstallEntries } from '@/modules/harness/services/install-plan.service';
import { mergeHarnessSettings } from '@/modules/harness/services/merge.service';
import { hookShimTemplate } from '@/modules/harness/templates/hook-shim.template';

const createInput = (overrides: Partial<Parameters<typeof harnessInstallEntries>[0]> = {}) => {
	return {
		mode: 'create' as const,
		agentKit: false,
		claudeMd: null,
		settingsJson: null,
		...overrides
	};
};

const entryFor = (entries: ReturnType<typeof harnessInstallEntries>, path: string) => {
	return entries.find((entry) => {
		return entry.path === path;
	});
};

const HARNESS_PATHS = [
	'.harness/.gitignore',
	'.harness/MEMORY.md',
	'.harness/BOOTSTRAP.md',
	'.harness/config.json',
	'.harness/decisions/README.md',
	'.harness/docs/README.md',
	'.harness/plans/README.md',
	'.harness/templates/README.md',
	'.harness/templates/decision.md',
	'.harness/templates/skill.md',
	'.harness/templates/plan.md',
	'.harness/templates/docs/topic.md',
	'.harness/templates/docs/architecture.md',
	'.harness/templates/docs/runbook.md',
	'.claude/skills/harness-onboard/SKILL.md',
	'.claude/skills/harness-review/SKILL.md',
	'.claude/skills/harness-curate/SKILL.md',
	'.harness/bin/hooks.mjs',
	'.harness/bin/harness-hook.mjs',
	'CLAUDE.md',
	'.claude/settings.json',
	'.harness/core/manifest.json'
];

describe('the harness install plan', () => {
	it('plans every file of the design table, plus the manifest and the base copies', () => {
		const entries = harnessInstallEntries(createInput());

		const paths = entries.map((entry) => {
			return entry.path;
		});

		for (const path of HARNESS_PATHS) {
			expect(paths).toContain(path);
		}

		const basePaths = paths.filter((path) => {
			return path.startsWith('.harness/core/base/');
		});

		expect(basePaths.length).toBeGreaterThan(0);

		for (const base of basePaths) {
			expect(paths).toContain(base.slice('.harness/core/base/'.length));
		}

		for (const banned of ['.harness/curator.json', '.harness/state/', '.harness/archive/']) {
			expect(
				paths.some((path) => {
					return path === banned || path.startsWith(banned);
				})
			).toBe(false);
		}
	});

	it('records version, kind and sha256 for each managed, block and config path, nothing else', () => {
		const entries = harnessInstallEntries(createInput());

		const manifest = JSON.parse(entryFor(entries, '.harness/core/manifest.json')?.content ?? '{}') as {
			version: string;
			files: Array<{ path: string; kind: string; sha256: string }>;
		};

		expect(manifest.version).toBe(PACKAGE.version);

		const kinds = new Set(
			manifest.files.map((file) => {
				return file.kind;
			})
		);

		expect([...kinds].toSorted()).toEqual(['block', 'config', 'managed']);
		expect(
			manifest.files.some((file) => {
				return file.path === 'CLAUDE.md';
			})
		).toBe(true);
		expect(
			manifest.files.some((file) => {
				return file.path === '.harness/config.json';
			})
		).toBe(true);
		expect(
			manifest.files.some((file) => {
				return file.path === '.harness/MEMORY.md';
			})
		).toBe(false);

		for (const file of manifest.files) {
			expect(file.sha256).toMatch(/^[0-9a-f]{64}$/);
		}
	});

	it('creates CLAUDE.md with only the block when missing, and appends it after one blank line', () => {
		const fresh = entryFor(harnessInstallEntries(createInput()), 'CLAUDE.md')?.content ?? '';

		expect(fresh.startsWith(`${HARNESS_BLOCK_BEGIN}\n`)).toBe(true);
		expect(fresh.trimEnd().endsWith(HARNESS_BLOCK_END)).toBe(true);

		const appended =
			entryFor(harnessInstallEntries(createInput({ claudeMd: '# My repo\n\nSome text.\n' })), 'CLAUDE.md')?.content ??
			'';

		expect(appended.startsWith('# My repo\n\nSome text.\n\n')).toBe(true);
		expect(appended.trimEnd().endsWith(HARNESS_BLOCK_END)).toBe(true);
	});

	it('replaces a stale block in place and keeps the text around it', () => {
		const entries = harnessInstallEntries(createInput());
		const block = entryFor(entries, 'CLAUDE.md')?.content ?? '';
		const stale = `# Repo\n\n${HARNESS_BLOCK_BEGIN}\nold rules\n${HARNESS_BLOCK_END}\n\nAfter.\n`;

		const merged = entryFor(harnessInstallEntries(createInput({ claudeMd: stale })), 'CLAUDE.md')?.content ?? '';

		expect(merged.startsWith('# Repo\n\n')).toBe(true);
		expect(merged.endsWith('\n\nAfter.\n')).toBe(true);
		expect(merged).toContain(HARNESS_BLOCK_BEGIN);
		expect(merged).not.toContain('old rules');
		expect(merged.length).toBeGreaterThan(block.length);
	});

	it('creates .claude/settings.json with the five hook entries when absent', () => {
		const content = entryFor(harnessInstallEntries(createInput()), '.claude/settings.json')?.content ?? '';

		const parsed = JSON.parse(content) as {
			hooks: Record<
				string,
				Array<{ matcher?: string; hooks: Array<{ type: string; command: string; async: boolean }> }>
			>;
		};

		expect(Object.keys(parsed).toSorted()).toEqual(['hooks']);
		expect(Object.keys(parsed.hooks).toSorted()).toEqual(
			['PostToolUse', 'PostToolUseFailure', 'SessionStart', 'Stop'].toSorted()
		);

		const sessionStart = parsed.hooks['SessionStart'] ?? [];

		expect(sessionStart).toHaveLength(1);
		expect(sessionStart[0]?.matcher).toBe('startup|resume|clear|compact');
		expect(sessionStart[0]?.hooks[0]?.command).toContain('.harness/bin/harness-hook.mjs');

		const postToolUse = parsed.hooks['PostToolUse'] ?? [];

		expect(postToolUse).toHaveLength(2);
		expect(postToolUse[0]?.hooks[0]?.async).toBe(false);
		expect(postToolUse[1]?.hooks[0]?.async).toBe(true);
	});

	it('adds the harness entries to existing settings and keeps every other key and hook', () => {
		const raw = JSON.stringify({
			name: 'x',
			hooks: {
				SessionStart: [
					{
						matcher: 'resume',
						hooks: [
							{
								type: 'command',
								command: 'echo mine'
							}
						]
					}
				]
			}
		});

		const merged = JSON.parse(mergeHarnessSettings(raw)) as {
			name?: string;
			hooks: Record<string, Array<{ matcher?: string; hooks: Array<{ command: string }> }>>;
		};

		expect(merged.name).toBe('x');

		const sessionStart = merged.hooks['SessionStart'] ?? [];

		expect(sessionStart).toHaveLength(2);
		expect(sessionStart[0]?.hooks[0]?.command).toBe('echo mine');
		expect(sessionStart[0]?.matcher).toBe('resume');
		expect(sessionStart[1]?.hooks[0]?.command).toContain('.harness/bin/harness-hook.mjs');

		expect(mergeHarnessSettings(mergeHarnessSettings(raw))).toBe(mergeHarnessSettings(raw));
	});

	it('refreshes the timeout on a harness entry an earlier release wrote', () => {
		const previous = JSON.stringify({
			hooks: {
				SessionStart: [
					{
						matcher: 'startup|resume|clear|compact',
						hooks: [
							{
								type: 'command',
								command: HOOK_COMMAND,
								async: false
							}
						]
					}
				]
			}
		});

		const merged = JSON.parse(mergeHarnessSettings(previous)) as {
			hooks: Record<string, Array<{ hooks: Array<{ command: string; timeout?: number }> }>>;
		};

		const sessionStart = merged.hooks['SessionStart'] ?? [];

		expect(sessionStart).toHaveLength(1);
		expect(sessionStart[0]?.hooks[0]?.command).toBe(HOOK_COMMAND);
		expect(sessionStart[0]?.hooks[0]?.timeout).toBe(HOOK_TIMEOUT_SECONDS);
	});

	it('puts the AgentKit lines in the CLAUDE block only when AgentKit is on', () => {
		const off = entryFor(harnessInstallEntries(createInput()), 'CLAUDE.md')?.content ?? '';
		const on = entryFor(harnessInstallEntries(createInput({ agentKit: true })), 'CLAUDE.md')?.content ?? '';

		const harnessBullet =
			'- Do not edit what an update replaces; put a correction in a learned skill or a memory line instead:\n' +
			'  - `harness-*` skills, `.harness/{bin,core,templates}/`: `jss-devtools harness update`.';

		const agentKitBullets =
			'  - `ak-*` skills, `.claude/{hooks,rules,agents,output-styles,scripts}/`: `ak update`.\n' +
			'- AgentKit owns `.harness/{docs,plans}/`: follow its skills there. It also works in `.harness/decisions/`.';

		expect(off).toContain(harnessBullet);
		expect(off).not.toContain('AgentKit');

		expect(on).toContain(`${harnessBullet}\n${agentKitBullets}`);
		expect(on.replace(`\n${agentKitBullets}`, '')).toBe(off);
	});

	it('mentions AgentKit in no folder README', () => {
		for (const entry of harnessInstallEntries(createInput({ agentKit: true }))) {
			if (!entry.path.endsWith('README.md')) {
				continue;
			}

			expect(entry.content).not.toContain('AgentKit');
		}
	});

	it('installs the create-mode bootstrap in create mode and the existing-mode copy otherwise', () => {
		const create = entryFor(harnessInstallEntries(createInput()), '.harness/BOOTSTRAP.md')?.content ?? '';

		const existing =
			entryFor(harnessInstallEntries(createInput({ mode: 'existing' })), '.harness/BOOTSTRAP.md')?.content ?? '';

		expect(create).not.toBe(existing);
		expect(create).toContain('new project');
		expect(existing).toContain('already has code');
	});

	it('ends every text entry with exactly one newline', () => {
		const entries = harnessInstallEntries(createInput());

		for (const entry of entries) {
			if (entry.path.endsWith('.harness/bin/hooks.mjs')) {
				continue;
			}

			expect(entry.content.endsWith('\n')).toBe(true);
			expect(entry.content.endsWith('\n\n')).toBe(false);
		}
	});

	it('writes the hook shim and the hook bundle as managed files', () => {
		const entries = harnessInstallEntries(createInput());

		expect(entryFor(entries, '.harness/bin/hooks.mjs')?.content.length).toBeGreaterThan(0);
		expect(entryFor(entries, '.harness/bin/harness-hook.mjs')?.content).toBe(hookShimTemplate(PACKAGE.nodeFloor));
	});

	it('installs the decided config defaults', () => {
		const content = entryFor(harnessInstallEntries(createInput()), '.harness/config.json')?.content ?? '';

		expect(JSON.parse(content)).toEqual({
			review: { minToolCalls: 10 },
			memory: {
				maxChars: 4800,
				maxEntryChars: 300
			},
			curator: {
				minLearnedSkills: 10,
				intervalDays: 7,
				staleDays: 14,
				archiveDays: 28
			}
		});
	});
});
