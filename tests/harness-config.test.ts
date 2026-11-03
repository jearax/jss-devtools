import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { readConfig } from '@/modules/harness/services/config.service';
import { HARNESS_CONFIG_DEFAULTS } from '@/modules/harness/templates/harness-config.template';

import { makeEmptyDir } from './support/tmp-dir';

const writeConfig = (root: string, value: unknown): void => {
	const path = join(root, '.harness/config.json');

	mkdirSync(dirname(path), {
		recursive: true
	});

	writeFileSync(path, JSON.stringify(value, null, '\t'));
};

describe('the harness config keys', () => {
	it('validates every key the defaults declare', async () => {
		const root = await makeEmptyDir();

		writeConfig(root, HARNESS_CONFIG_DEFAULTS);

		expect(readConfig(root).problems).toEqual([]);

		for (const [group, values] of Object.entries(HARNESS_CONFIG_DEFAULTS)) {
			for (const key of Object.keys(values)) {
				const partial: Record<string, Record<string, unknown>> = {};

				for (const [name, entries] of Object.entries(HARNESS_CONFIG_DEFAULTS)) {
					partial[name] = {
						...entries
					};
				}

				const groupValues = partial[group];

				if (groupValues !== undefined) {
					delete groupValues[key];
				}

				writeConfig(root, partial);

				expect(readConfig(root).problems.join('\n')).toContain(`"${group}.${key}"`);
			}
		}
	});
});
