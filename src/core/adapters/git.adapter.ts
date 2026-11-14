import { runCommand } from '@/core/utils/run-command.util';

export type GitVersion =
	{ status: 'ok'; output: string } | { status: 'missing'; problem: string } | { status: 'failed'; problem: string };

export const gitVersion = async (): Promise<GitVersion> => {
	const result = await runCommand('git', ['--version']);

	if (result.code === null) {
		return {
			status: 'missing',
			problem: 'Git is not installed'
		};
	}

	if (result.code !== 0) {
		return {
			status: 'failed',
			problem: `git --version failed with exit code ${result.code}`
		};
	}

	const output = result.stdout.trim();

	if (output.length === 0) {
		return {
			status: 'failed',
			problem: 'git --version printed nothing'
		};
	}

	return {
		status: 'ok',
		output
	};
};

export const gitInit = async (cwd: string): Promise<boolean> => {
	const result = await runCommand('git', ['init', '-q', '-b', 'main'], { cwd });

	return result.code === 0;
};

export const gitHooksPath = async (cwd: string): Promise<string | null> => {
	const result = await runCommand('git', ['config', '--get', 'core.hooksPath'], { cwd });

	return result.code === 0 ? result.stdout.trim() : null;
};

export const gitTopLevel = async (cwd: string): Promise<string | null> => {
	const result = await runCommand('git', ['rev-parse', '--show-toplevel'], { cwd });

	return result.code === 0 ? result.stdout.trim() : null;
};

// What git would publish: tracked plus untracked-but-not-ignored files, NUL separated.
export const gitPublishableFiles = async (cwd: string): Promise<string[] | null> => {
	const result = await runCommand(
		'git',
		['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', '.harness', 'CLAUDE.md', '.claude/skills'],
		{ cwd }
	);

	return result.code === 0
		? result.stdout.split('\0').filter((name) => {
				return name !== '';
			})
		: null;
};

export const gitMergeFile = async (
	current: string,
	base: string,
	other: string
): Promise<{ code: number | null; stdout: string; stderr: string }> => {
	const result = await runCommand('git', [
		'merge-file',
		'-p',
		'-L',
		'yours',
		'-L',
		'the installed version',
		'-L',
		'the new version',
		current,
		base,
		other
	]);

	return {
		code: result.code,
		stdout: result.stdout,
		stderr: result.stderr
	};
};

export type GitWorktreeChanges =
	{ kind: 'ok'; status: string; diff: string } | { kind: 'missing' } | { kind: 'failed'; problem: string };

const failureOf = (what: string, result: { code: number | null; stderr: string }): string => {
	const detail = result.stderr.trim();

	return detail === '' ? `${what} failed with exit code ${result.code}` : `${what} failed: ${detail}`;
};

export const gitWorktreeChanges = async (cwd: string): Promise<GitWorktreeChanges> => {
	if ((await gitTopLevel(cwd)) === null) {
		return {
			kind: 'missing'
		};
	}

	const status = await runCommand('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], { cwd });

	if (status.code !== 0) {
		return {
			kind: 'failed',
			problem: failureOf('git status', status)
		};
	}

	const diff = await runCommand('git', ['diff', 'HEAD', '--no-ext-diff'], { cwd });

	if (diff.code !== 0) {
		// A repository with no commit has no HEAD to diff against; the status still lists the tree.
		const head = await runCommand('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd });

		if (head.code !== 0) {
			return {
				kind: 'ok',
				status: status.stdout,
				diff: ''
			};
		}

		return {
			kind: 'failed',
			problem: failureOf('git diff', diff)
		};
	}

	return {
		kind: 'ok',
		status: status.stdout,
		diff: diff.stdout
	};
};
