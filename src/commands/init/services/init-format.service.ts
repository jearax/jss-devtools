import { localBinCommandLine, runLocalBin } from '@/core/adapters/package-manager.adapter';
import { CliError } from '@/core/errors/cli.error';
import { shellQuote } from '@/core/utils/shell-quote.util';

import type { InitPreflight } from '@/commands/init/types/init-plan.type';

export const nextStepCommands = (preflight: InitPreflight, relativeTarget: string, command: string): string[] => {
	const cd = preflight.mode === 'create' && relativeTarget !== '' ? [`cd ${shellQuote(relativeTarget)}`] : [];

	return [...cd, command];
};

const binFailureMessage = (action: string, bin: string, result: { stdout: string; stderr: string }): string => {
	const output = result.stderr.trim() || result.stdout.trim();

	return output === ''
		? `Could not ${action} with ${bin}; the files are written`
		: `Could not ${action} with ${bin}; the files are written\n${output}`;
};

export const sortFailureMessage = (bin: string, result: { stdout: string; stderr: string }): string => {
	return binFailureMessage('sort package.json', bin, result);
};

const formatFailureMessage = (result: { stdout: string; stderr: string }): string => {
	return binFailureMessage('format', 'prettier', result);
};

const PRETTIER_EXTENSIONS = /\.(?:[cm]?[jt]sx?|json|jsonc|md|markdown|ya?ml)$/;

export const prettierPaths = (entries: readonly { action: string; path: string; content?: string }[]): string[] => {
	return entries
		.filter((entry) => {
			return entry.action !== 'delete' && entry.content !== undefined && PRETTIER_EXTENSIONS.test(entry.path);
		})
		.map((entry) => {
			return entry.path;
		});
};

export const sortPackageJson = async (
	preflight: InitPreflight,
	relativeTarget: string,
	cwd: string,
	manifests: readonly string[]
): Promise<void> => {
	for (const manifest of manifests) {
		for (const bin of ['prettier-package-json', 'prettier'] as const) {
			const args = ['--write', manifest];

			const result = await runLocalBin(preflight.pm, bin, args, cwd);

			if (result.code !== 0) {
				throw new CliError(sortFailureMessage(bin, result), {
					commands: nextStepCommands(preflight, relativeTarget, localBinCommandLine(preflight.pm, bin, args))
				});
			}
		}
	}
};

export const formatWrittenFiles = async (
	preflight: InitPreflight,
	relativeTarget: string,
	cwd: string,
	paths: readonly string[]
): Promise<void> => {
	if (paths.length === 0) {
		return;
	}

	const args = ['--write', ...paths];

	const result = await runLocalBin(preflight.pm, 'prettier', args, cwd);

	if (result.code !== 0) {
		throw new CliError(formatFailureMessage(result), {
			commands: nextStepCommands(preflight, relativeTarget, localBinCommandLine(preflight.pm, 'prettier', args))
		});
	}
};

export const installError = (preflight: InitPreflight, relativeTarget: string): CliError => {
	return new CliError('Install failed; the files are written', {
		commands: nextStepCommands(preflight, relativeTarget, `${preflight.pm} install`)
	});
};
