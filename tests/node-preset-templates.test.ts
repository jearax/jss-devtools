import { describe, expect, it } from 'vitest';

import { commitlintConfigMjsTemplate } from '@/commands/init/templates/commitlint-config-mjs.template';
import { editorconfigTemplate } from '@/commands/init/templates/editorconfig.template';
import { eslintConfigMjsTemplate } from '@/commands/init/templates/eslint-config-mjs.template';
import { gitignoreTemplate } from '@/commands/init/templates/gitignore.template';
import { huskyCommitMsgTemplate } from '@/commands/init/templates/husky-commit-msg.template';
import { huskyPreCommitTemplate } from '@/commands/init/templates/husky-pre-commit.template';
import { packageJsonTemplate } from '@/commands/init/templates/package-json.template';
import { pnpmWorkspaceYamlTemplate } from '@/commands/init/templates/pnpm-workspace-yaml.template';
import { prettierignoreTemplate } from '@/commands/init/templates/prettierignore.template';
import { prettierrcJsonTemplate } from '@/commands/init/templates/prettierrc-json.template';
import { srcMainTemplate } from '@/commands/init/templates/src-main.template';
import { tsconfigJsonTemplate } from '@/commands/init/templates/tsconfig-json.template';
import { vscodeExtensionsJsonTemplate } from '@/commands/init/templates/vscode-extensions-json.template';
import { vscodeSettingsJsonTemplate } from '@/commands/init/templates/vscode-settings-json.template';
import { localBinCommandLine } from '@/core/adapters/package-manager.adapter';
import { PACKAGE } from '@/core/constants/package.constant';

const PROJECT_NAME = 'my-app';
const NODE_FLOOR = PACKAGE.nodeFloor;

describe('node preset templates', () => {
	it('renders package.json per package manager', () => {
		for (const packageManager of ['bun', 'pnpm', 'yarn', 'npm'] as const) {
			expect(
				packageJsonTemplate({
					projectName: PROJECT_NAME,
					packageManager,
					packageManagerVersion: '1.2.3',
					nodeFloor: NODE_FLOOR
				})
			).toMatchSnapshot(`package.json ${packageManager}`);
		}
	});

	it('renders tsconfig.json', () => {
		expect(tsconfigJsonTemplate()).toMatchSnapshot();
	});

	it('renders src/main.ts', () => {
		expect(srcMainTemplate({ projectName: PROJECT_NAME })).toMatchSnapshot();
	});

	it('renders eslint.config.mjs', () => {
		expect(eslintConfigMjsTemplate()).toMatchSnapshot();
	});

	it('renders .prettierrc.json', () => {
		expect(prettierrcJsonTemplate()).toMatchSnapshot();
	});

	it('renders .editorconfig', () => {
		expect(editorconfigTemplate()).toMatchSnapshot();
	});

	it('renders commitlint.config.mjs', () => {
		expect(commitlintConfigMjsTemplate()).toMatchSnapshot();
	});

	it('renders .vscode/settings.json per package manager', () => {
		for (const packageManager of ['bun', 'pnpm', 'yarn', 'npm'] as const) {
			expect(vscodeSettingsJsonTemplate({ packageManager })).toMatchSnapshot(`vscode settings ${packageManager}`);
		}
	});

	it('renders .vscode/extensions.json', () => {
		expect(vscodeExtensionsJsonTemplate()).toMatchSnapshot();
	});

	it('renders .gitignore', () => {
		expect(gitignoreTemplate()).toMatchSnapshot();
	});

	it('renders .prettierignore', () => {
		expect(prettierignoreTemplate()).toMatchSnapshot();
	});

	it('renders the husky hooks per package manager', () => {
		for (const packageManager of ['bun', 'pnpm', 'yarn', 'npm'] as const) {
			const input = {
				command: localBinCommandLine(packageManager, 'lint-staged', [])
			};

			expect(huskyPreCommitTemplate(input)).toMatchSnapshot(`pre-commit ${packageManager}`);

			const commitMsgInput = {
				command: localBinCommandLine(packageManager, 'commitlint', ['--edit', '"$1"'])
			};

			expect(huskyCommitMsgTemplate(commitMsgInput)).toMatchSnapshot(`commit-msg ${packageManager}`);
		}
	});

	it('renders pnpm-workspace.yaml', () => {
		expect(pnpmWorkspaceYamlTemplate()).toMatchSnapshot();
	});
});

const splitTopLevel = (body: string): string[] => {
	const parts: string[] = [];
	let depth = 0;
	let current = '';

	for (const character of body) {
		if (character === '{') {
			depth += 1;
		} else if (character === '}') {
			depth -= 1;
		}

		if (character === ',' && depth === 0) {
			parts.push(current);
			current = '';
			continue;
		}

		current += character;
	}

	parts.push(current);

	return parts;
};

const expandBraces = (pattern: string): string[] => {
	const start = pattern.indexOf('{');

	if (start === -1) {
		return [pattern];
	}

	let depth = 0;
	let end = -1;

	for (let index = start; index < pattern.length; index += 1) {
		if (pattern[index] === '{') {
			depth += 1;
		} else if (pattern[index] === '}') {
			depth -= 1;

			if (depth === 0) {
				end = index;
				break;
			}
		}
	}

	const parts = splitTopLevel(pattern.slice(start + 1, end));
	const expanded: string[] = [];

	for (const part of parts) {
		const inner = part.includes(',') ? expandBraces(part) : [part];

		for (const candidate of inner) {
			expanded.push(pattern.slice(0, start) + candidate + pattern.slice(end + 1));
		}
	}

	return expanded;
};

const lintSourceFolders = (): string[] => {
	const packageJson = JSON.parse(
		packageJsonTemplate({
			projectName: PROJECT_NAME,
			packageManager: 'pnpm',
			packageManagerVersion: '1.2.3',
			nodeFloor: NODE_FLOOR
		})
	) as { scripts: Record<string, string> };

	const lint = packageJson.scripts['lint']!;

	const start = lint.indexOf('{');
	let depth = 0;
	let end = -1;

	for (let index = start; index < lint.length; index += 1) {
		if (lint[index] === '{') {
			depth += 1;
		} else if (lint[index] === '}') {
			depth -= 1;

			if (depth === 0) {
				end = index;
				break;
			}
		}
	}

	return expandBraces(lint.slice(start, end + 1)).map((folder) => {
		return folder.replace(/\/$/, '');
	});
};

const ignoreEntries = (raw: string): string[] => {
	return raw
		.split('\n')
		.map((line) => {
			return line.trim();
		})
		.filter((line) => {
			return line !== '' && !line.startsWith('#');
		});
};

describe('the preset ignore files', () => {
	it('repeats no entry of the .gitignore in the .prettierignore', () => {
		const gitignore = new Set(ignoreEntries(gitignoreTemplate()));

		const repeated = ignoreEntries(prettierignoreTemplate()).filter((entry) => {
			return gitignore.has(entry);
		});

		expect(repeated).toEqual([]);
	});

	it('ignores no folder the lint glob treats as source', () => {
		const sourceFolders = lintSourceFolders();

		const offending = ignoreEntries(gitignoreTemplate()).filter((entry) => {
			const name = entry.replace(/^\.+/, '').split('/')[0]!.replace(/\/$/, '');

			return sourceFolders.includes(name);
		});

		expect(offending).toEqual([]);
	});
});
