import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { gitTopLevel } from '@/core/adapters/git.adapter';
import { CliError } from '@/core/errors/cli.error';
import {
	HARNESS_CONFIG,
	HARNESS_MANIFEST,
	HARNESS_UPDATE_LOCK
} from '@/modules/harness/constants/harness-paths.constant';

import { missingConfigKeys } from './config-merge.service';
import { loadUpdateSession } from './staging.service';
import { readManifest } from './update-manifest.service';
import { compareHarnessVersions, INSTALL_COMMAND_LINE } from './update-release.service';

import type { InstalledManifest } from '@/modules/harness/types/update.type';

export type UpdateMode = 'update' | 'continue';

export type UpdatePreflight = {
	status: 'ok' | 'up-to-date';
	manifest: InstalledManifest;
};

const DOT_GIT = `.${'git'}`;

const ensureGitRoot = async (cwd: string): Promise<void> => {
	if (existsSync(join(cwd, DOT_GIT))) {
		return;
	}

	const top = await gitTopLevel(cwd);

	if (top === null) {
		throw new CliError('Not a git repository', {
			label: 'To set one up',
			commands: ['git init']
		});
	}

	throw new CliError('This is not the git root', {
		hint: 'Run it there'
	});
};

const configJsonLine = (raw: string, message: string): string => {
	const inline = /\(line (\d+) column \d+\)/.exec(message);
	const position = /position (\d+)/.exec(message);

	const at =
		inline?.[1] ??
		(position === null ? null : String(raw.slice(0, Number.parseInt(position[1] ?? '0', 10)).split('\n').length));

	return at === null ? 'unknown line' : `line ${at}`;
};

export const parseConfigJson = (cwd: string): string => {
	const path = join(cwd, HARNESS_CONFIG);
	const raw = readFileSync(path, 'utf8');

	try {
		JSON.parse(raw);
	} catch (error) {
		throw new CliError(
			`Invalid JSON in ${HARNESS_CONFIG} (${configJsonLine(raw, (error as Error).message)}): ${(error as Error).message}`
		);
	}

	return raw;
};

const ensureBaseCopies = (cwd: string, manifest: InstalledManifest): void => {
	const missing = manifest.files.filter((file) => {
		return !existsSync(join(cwd, '.harness/core/base', file.path));
	});

	if (missing.length > 0) {
		throw new CliError(
			`Missing base copies: ${missing
				.map((file) => {
					return file.path;
				})
				.join(', ')}`,
			{
				hint: 'Restore .harness/core from git, then rerun'
			}
		);
	}
};

const liveConfigRaw = (cwd: string, configInManifest: boolean): string => {
	const path = join(cwd, HARNESS_CONFIG);

	return configInManifest && existsSync(path) ? readFileSync(path, 'utf8') : '{}';
};

export const runUpdatePreflight = async (
	cwd: string,
	releaseVersion: string,
	mode: UpdateMode
): Promise<UpdatePreflight> => {
	await ensureGitRoot(cwd);

	let manifest: InstalledManifest;

	try {
		manifest = readManifest(cwd);
	} catch (error) {
		if (error instanceof CliError) {
			throw error;
		}

		throw new CliError(`Invalid JSON in ${HARNESS_MANIFEST}: ${(error as Error).message}`);
	}

	if (compareHarnessVersions(releaseVersion, manifest.version) < 0) {
		throw new CliError(`refusing downgrade ${manifest.version} -> ${releaseVersion}`, {
			label: 'To update the CLI',
			commands: [INSTALL_COMMAND_LINE]
		});
	}

	const session = loadUpdateSession(cwd);

	if (mode === 'continue' && session === null) {
		throw new CliError('No staged harness update to continue', {
			hint: 'Run jss-devtools harness update first'
		});
	}

	if (mode === 'update' && session !== null) {
		throw new CliError('A harness update is already staged', {
			label: 'To finish it',
			commands: ['jss-devtools harness update --continue', 'jss-devtools harness update --abort']
		});
	}

	if (existsSync(join(cwd, HARNESS_UPDATE_LOCK))) {
		throw new CliError('Another harness update appears to be running', {
			hint: `If none is, delete ${HARNESS_UPDATE_LOCK} and rerun`
		});
	}

	ensureBaseCopies(cwd, manifest);

	const configInManifest = manifest.files.some((file) => {
		return file.kind === 'config';
	});

	if (configInManifest && existsSync(join(cwd, HARNESS_CONFIG))) {
		parseConfigJson(cwd);
	}

	if (
		mode === 'update' &&
		manifest.version === releaseVersion &&
		missingConfigKeys(liveConfigRaw(cwd, configInManifest)).length === 0
	) {
		return {
			status: 'up-to-date',
			manifest
		};
	}

	return {
		status: 'ok',
		manifest
	};
};
