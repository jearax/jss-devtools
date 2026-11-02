import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { format, resolveConfig, version } from 'prettier';
import { afterAll, describe, expect, it } from 'vitest';

import { NODE_PRESET_DEPENDENCIES } from '@/commands/init/constants/node-preset-dependency.constant';
import { editorconfigTemplate } from '@/commands/init/templates/editorconfig.template';
import { prettierrcJsonTemplate } from '@/commands/init/templates/prettierrc-json.template';
import { harnessInstallEntries } from '@/modules/harness/services/install-plan.service';

import { makeEmptyDir, removeDir } from './support/tmp-dir';

import type { HarnessInstallInput } from '@/modules/harness/services/install-plan.service';

const dirs: string[] = [];

afterAll(async () => {
	for (const dir of dirs.splice(0)) {
		await removeDir(dir);
	}
});

const scaffoldFolder = async (): Promise<string> => {
	const dir = await makeEmptyDir();

	dirs.push(dir);

	await writeFile(join(dir, '.prettierrc.json'), prettierrcJsonTemplate());
	await writeFile(join(dir, '.editorconfig'), editorconfigTemplate());

	return dir;
};

const INPUTS: readonly HarnessInstallInput[] = [
	{
		mode: 'create',
		agentKit: false,
		claudeMd: null,
		settingsJson: null
	},
	{
		mode: 'create',
		agentKit: true,
		claudeMd: null,
		settingsJson: null
	},
	{
		mode: 'existing',
		agentKit: false,
		claudeMd: null,
		settingsJson: null
	},
	{
		mode: 'existing',
		agentKit: true,
		claudeMd: null,
		settingsJson: null
	},
	{
		mode: 'existing',
		agentKit: false,
		claudeMd: '# My repo\n\nSome text.\n',
		settingsJson: null
	},
	{
		mode: 'existing',
		agentKit: true,
		claudeMd: '# My repo\n\nSome text.\n',
		settingsJson: null
	}
];

const markdownEntries = (): { path: string; content: string }[] => {
	const seen = new Set<string>();
	const entries: { path: string; content: string }[] = [];

	for (const input of INPUTS) {
		for (const entry of harnessInstallEntries(input)) {
			if (!entry.path.endsWith('.md') || entry.content === undefined) {
				continue;
			}

			if (seen.has(entry.content)) {
				continue;
			}

			seen.add(entry.content);
			entries.push({
				path: entry.path,
				content: entry.content
			});
		}
	}

	return entries;
};

describe('the Markdown the harness installs', () => {
	it('pins the repo Prettier to the version the scaffold installs', () => {
		expect(version).toBe(NODE_PRESET_DEPENDENCIES['prettier']);
	});

	it('installs every Markdown file already in Prettier output', async () => {
		const dir = await scaffoldFolder();
		const entries = markdownEntries();

		expect(entries.length).toBeGreaterThan(0);

		const drifted: string[] = [];

		for (const entry of entries) {
			const path = join(dir, entry.path);

			const config = await resolveConfig(path, { editorconfig: true });

			const formatted = await format(entry.content, {
				...(config ?? {}),
				filepath: path
			});

			if (formatted !== entry.content) {
				drifted.push(entry.path);
			}
		}

		expect(drifted).toEqual([]);
	});
});
