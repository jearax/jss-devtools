import { spawnSync, execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { HOOK_ERROR_LOG_MAX_BYTES } from '@/modules/harness/constants/harness-limits.constant';
import { HARNESS_CONFIG_DEFAULTS } from '@/modules/harness/templates/harness-config.template';
import { harnessMemoryTemplate } from '@/modules/harness/templates/harness-seeds.template';

import { makeEmptyDir, removeDir } from './support/tmp-dir';

const exec = promisify(execFile);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS = resolve(projectRoot, 'di' + 'st/hooks.mjs');

const write = (root: string, rel: string, content: string): void => {
	mkdirSync(dirname(resolve(root, rel)), { recursive: true });
	writeFileSync(resolve(root, rel), content);
};

const DEFAULT_CONFIG = HARNESS_CONFIG_DEFAULTS;

let root = '';

const makeRepo = async (config: unknown = DEFAULT_CONFIG): Promise<void> => {
	root = await makeEmptyDir();
	tmpDirs.push(root);
	await exec('git', ['init', '-q', '-b', 'main'], { cwd: root });
	await exec('git', ['config', 'user.email', 't@t'], { cwd: root });
	await exec('git', ['config', 'user.name', 't'], { cwd: root });
	write(root, '.harness/config.json', JSON.stringify(config));
	write(root, '.harness/.gitignore', 'state/\nupdate/\n');
	write(root, '.harness/MEMORY.md', '# Memory\n- uses pnpm workspaces\n');
	await exec('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: root });
	write(root, '.harness/decisions/README.md', '# Decisions\n\n| # | Title | Status | Date |\n|---|---|---|---|\n');
	write(root, '.harness/docs/README.md', '# Docs\n\n| Doc | Kind | Summary |\n|---|---|---|\n');
};

const dayOffset = (days: number): string => {
	return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

const hook = (payload: object): { stdout: string; status: number } => {
	const result = spawnSync(process.execPath, [HOOKS], {
		cwd: root,
		input: JSON.stringify(payload),
		encoding: 'utf8'
	});

	return {
		stdout: result.stdout ?? '',
		status: result.status ?? -1
	};
};

const guard = (payload: object): { stdout: string; status: number } => {
	const result = spawnSync(process.execPath, [HOOKS, 'memory-guard'], {
		cwd: root,
		input: JSON.stringify(payload),
		encoding: 'utf8'
	});

	return {
		stdout: result.stdout ?? '',
		status: result.status ?? -1
	};
};

const failHook = (): void => {
	spawnSync(process.execPath, [HOOKS], {
		cwd: root,
		input: 'not json',
		encoding: 'utf8'
	});
};

const contextOf = (stdout: string): string => {
	if (stdout.trim() === '') {
		return '';
	}

	const parsed = JSON.parse(stdout) as {
		hookSpecificOutput?: { additionalContext?: string };
		decision?: string;
	};

	return parsed.hookSpecificOutput?.additionalContext ?? '';
};

const sessionStart = (): string => {
	return contextOf(
		hook({
			hook_event_name: 'SessionStart',
			session_id: 's1',
			source: 'startup'
		}).stdout
	);
};

const toolPayload = (tool: string, input: Record<string, unknown>): object => {
	return {
		hook_event_name: 'PostToolUse',
		session_id: 's1',
		tool_name: tool,
		tool_input: input
	};
};

const stop = (): { stdout: string; status: number } => {
	return hook({
		hook_event_name: 'Stop',
		session_id: 's1'
	});
};

const readLog = (): unknown[] => {
	const path = resolve(root, '.harness/state/sessions/s1.jsonl');

	if (!existsSync(path)) {
		return [];
	}

	return readFileSync(path, 'utf8')
		.split('\n')
		.filter(Boolean)
		.map((line) => {
			return JSON.parse(line) as unknown;
		});
};

const STALE_MTIME = (Date.now() - 8 * 24 * 60 * 60 * 1000) / 1000;

const tmpDirs: string[] = [];

afterAll(async () => {
	await Promise.all(
		tmpDirs.map((dir) => {
			return removeDir(dir);
		})
	);
});

beforeEach(async () => {
	await makeRepo();
});

const decision = (id: string, title: string, status: string): void => {
	write(
		root,
		`.harness/decisions/${id}-x.md`,
		`---\nid: ${id}\ntitle: ${title}\nstatus: ${status}\ndate: 2026-11-01\n---\nbody\n`
	);
};

const learnedSkill = (name: string): void => {
	write(
		root,
		`.claude/skills/${name}/SKILL.md`,
		'---\nname: x\ndescription: d\nmetadata:\n\tharness-origin: learned\n---\nbody\n'
	);
};

describe('session start', () => {
	it('injects memory, decisions in force, skips superseded, exit 0', () => {
		decision('0001', 'First rule', 'Accepted');
		decision('0002', 'Old rule', 'Superseded by 0001');

		const { status } = hook({
			hook_event_name: 'SessionStart',
			session_id: 's1',
			source: 'startup'
		});

		const context = sessionStart();

		expect(status).toBe(0);
		expect(context).toContain('# Harness memory');
		expect(context).toContain('- uses pnpm workspaces');
		expect(context).toContain('First rule');
		expect(context).not.toContain('Old rule');
	});

	it('asks for onboarding while BOOTSTRAP.md exists', () => {
		write(root, '.harness/BOOTSTRAP.md', 'onboard\n');
		expect(sessionStart()).toContain('harness-onboard');
	});

	it('warns at the memory cap ratio', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			memory: {
				...DEFAULT_CONFIG.memory,
				maxChars: 100
			}
		});
		write(root, '.harness/MEMORY.md', `# Memory\n- ${'x'.repeat(90)}\n`);
		const context = sessionStart();

		expect(context).toContain('harness-curate');
	});

	it('warns per missing config key with the repair command', async () => {
		await makeRepo({ review: { minToolCalls: DEFAULT_CONFIG.review.minToolCalls } });
		const context = sessionStart();

		expect(context).toContain('memory.maxChars');
		expect(context).toContain('harness update');
	});

	it('survives a corrupt config.json', () => {
		write(root, '.harness/config.json', '{nope');

		const { status } = hook({
			hook_event_name: 'SessionStart',
			session_id: 's1'
		});

		expect(status).toBe(0);
		expect(sessionStart()).toContain('not valid JSON');
	});

	it('warns on decisions drift and skips docs drift when the AgentKit config exists', () => {
		decision('0001', 'First rule', 'Accepted');
		decision('0002', 'Second rule', 'Accepted');
		write(root, '.harness/docs/a.md', 'x\n');
		const withoutAk = sessionStart();

		expect(withoutAk).toContain('decisions/README.md is missing rows for: 0001, 0002');
		expect(withoutAk).toContain('docs/README.md is missing rows for: a');
		write(root, '.agentkit/config.yaml', 'paths:\n    docs: .harness/docs\n    plans: .harness/plans\n');
		const withAk = sessionStart();

		expect(withAk).not.toContain('docs/README.md');
	});

	it('warns hook errors since the last session, once', () => {
		write(root, '.harness/state/hook-errors.log', '2026-11-01T00:00:00Z boom\n');
		expect(sessionStart()).toContain('boom');
		expect(sessionStart()).not.toContain('boom');
	});

	it('caps the hook error log and reports only the errors after the trim', () => {
		const line = `2026-11-01T00:00:00.000Z ${'e'.repeat(200)}\n`;

		write(
			root,
			'.harness/state/hook-errors.log',
			line.repeat(Math.ceil((HOOK_ERROR_LOG_MAX_BYTES * 1.5) / line.length))
		);

		sessionStart();

		failHook();

		const logPath = resolve(root, '.harness/state/hook-errors.log');

		expect(statSync(logPath).size).toBeLessThanOrEqual(HOOK_ERROR_LOG_MAX_BYTES);
		expect(readFileSync(logPath, 'utf8').endsWith('\n')).toBe(true);

		const context = sessionStart();

		expect(context.split('the hook error log recorded').length - 1).toBe(1);
	});

	it('warns once on a symlinked MEMORY.md and leaks nothing from the target', async () => {
		const outside = await makeEmptyDir();

		tmpDirs.push(outside);
		writeFileSync(join(outside, 'outside.md'), 'secret from outside\n');
		rmSync(join(root, '.harness/MEMORY.md'));
		symlinkSync(join(outside, 'outside.md'), join(root, '.harness/MEMORY.md'));

		const context = sessionStart();

		expect(context).toContain('.harness/MEMORY.md is a symlink; the harness does not read or write through symlinks');
		expect(context.split('is a symlink').length - 1).toBe(1);
		expect(context).not.toContain('secret from outside');
		expect(context).not.toContain('# Harness memory');
	});

	it('appends a start line with the fingerprint baseline', () => {
		sessionStart();
		const lines = readLog();

		expect(lines).toHaveLength(1);
		const start = lines[0] as { type: string; fingerprint: string | null };

		expect(start.type).toBe('start');
		expect(typeof start.fingerprint).toBe('string');
	});
});

describe('memory guard', () => {
	it('blocks an oversized memory write and exits 0', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			memory: {
				...DEFAULT_CONFIG.memory,
				maxEntryChars: 20
			}
		});
		const long = '- '.concat('x'.repeat(30), '\n');

		write(root, '.harness/MEMORY.md', `# Memory\n${long}`);
		const result = guard(toolPayload('Write', { file_path: resolve(root, '.harness/MEMORY.md') }));

		expect(result.status).toBe(0);
		expect(JSON.parse(result.stdout)).toMatchObject({ decision: 'block' });
	});

	it('guards only: it never logs a session event', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			memory: {
				...DEFAULT_CONFIG.memory,
				maxEntryChars: 20
			}
		});
		write(root, '.harness/MEMORY.md', `# Memory\n- ${'x'.repeat(30)}\n`);
		guard(toolPayload('Write', { file_path: resolve(root, '.harness/MEMORY.md') }));

		expect(readLog()).toHaveLength(0);
	});

	it('does not block other files', () => {
		const { stdout, status } = guard(toolPayload('Write', { file_path: resolve(root, 'src/a.ts') }));

		expect(status).toBe(0);
		expect(stdout).toBe('');
	});

	it('skips a symlinked MEMORY.md like a missing one', async () => {
		const outside = await makeEmptyDir();

		tmpDirs.push(outside);
		writeFileSync(join(outside, 'outside.md'), 'secret from outside\n');
		rmSync(join(root, '.harness/MEMORY.md'));
		symlinkSync(join(outside, 'outside.md'), join(root, '.harness/MEMORY.md'));

		const result = guard(toolPayload('Write', { file_path: join(outside, 'outside.md') }));

		expect(result.status).toBe(0);
		expect(result.stdout).toBe('');
	});

	it('the logging entry counts a memory write without blocking', () => {
		const { stdout } = hook(toolPayload('Write', { file_path: resolve(root, '.harness/MEMORY.md') }));

		expect(stdout).toBe('');
		expect(readLog()).toHaveLength(1);
	});
});

describe('recording', () => {
	it('keeps every parallel PostToolUse event', () => {
		for (let index = 0; index < 8; index += 1) {
			spawnSync(process.execPath, [HOOKS], {
				cwd: root,
				input: JSON.stringify(toolPayload('Bash', { command: `pnpm test ${index}` })),
				encoding: 'utf8'
			});
		}

		const tools = readLog().filter((line) => {
			return (line as { type: string }).type === 'tool';
		});

		expect(tools).toHaveLength(8);
	});

	it('skips subagent payloads', () => {
		hook({
			...toolPayload('Bash', { command: 'x' }),
			agent_id: 'agent-1'
		});
		expect(readLog()).toHaveLength(0);
	});

	it('records skills from Skill, Read and Bash', () => {
		write(root, '.claude/skills/harness-review/SKILL.md', 'body\n');
		hook(toolPayload('Skill', { skill: 'harness-review' }));
		hook(toolPayload('Read', { file_path: resolve(root, '.claude/skills/harness-review/SKILL.md') }));
		hook(toolPayload('Bash', { command: 'cat .claude/skills/harness-review/SKILL.md' }));

		const skills = readLog()
			.filter((line) => {
				return (line as { type: string }).type === 'tool';
			})
			.flatMap((line) => {
				return (line as { skills: string[] }).skills;
			});

		expect(skills).toEqual(['harness-review', 'harness-review', 'harness-review']);
	});

	it('records a failure with secrets redacted', () => {
		hook({
			hook_event_name: 'PostToolUseFailure',
			session_id: 's1',
			tool_name: 'Bash',
			error: 'curl failed with sk-live-abcdefgh1234\nsecond line'
		});

		const fails = readLog().filter((line) => {
			return (line as { type: string }).type === 'fail';
		});

		expect(fails).toHaveLength(1);
		expect(fails[0]).toMatchObject({ error: 'curl failed with [redacted]' });
		expect(JSON.stringify(fails[0])).not.toContain('sk-live');
	});
});

describe('knowledge seeding', () => {
	it('reseeds a clone that lost the seeds and reports onboarding pending', () => {
		rmSync(join(root, '.harness/MEMORY.md'));
		rmSync(join(root, '.harness/decisions/README.md'), { force: true });
		rmSync(join(root, '.harness/docs/README.md'), { force: true });
		rmSync(join(root, '.harness/plans/README.md'), { force: true });

		const context = sessionStart();

		expect(readFileSync(join(root, '.harness/MEMORY.md'), 'utf8')).toBe(harnessMemoryTemplate);
		expect(existsSync(join(root, '.harness/decisions/README.md'))).toBe(true);
		expect(existsSync(join(root, '.harness/docs/README.md'))).toBe(true);
		expect(existsSync(join(root, '.harness/plans/README.md'))).toBe(true);
		expect(existsSync(join(root, '.harness/BOOTSTRAP.md'))).toBe(true);
		expect(context).toContain('Harness knowledge: private to this machine (gitignored)');
		expect(context).toContain('harness-onboard');
	});

	it('writes nothing when the key is true', () => {
		write(
			root,
			'.harness/config.json',
			JSON.stringify({
				...DEFAULT_CONFIG,
				knowledge: { share: true }
			})
		);
		rmSync(join(root, '.harness/MEMORY.md'));

		const context = sessionStart();

		expect(existsSync(join(root, '.harness/MEMORY.md'))).toBe(false);
		expect(existsSync(join(root, '.harness/BOOTSTRAP.md'))).toBe(false);
		expect(context).toContain('Harness knowledge: shared through git');
		expect(context).toContain('MEMORY.md is missing');
	});
});

describe('redaction in the hooks', () => {
	it('redacts a failure line before it reaches the log', () => {
		const token = 'ghp_' + 'a'.repeat(24);

		hook({
			hook_event_name: 'PostToolUseFailure',
			session_id: 's1',
			tool_name: 'Bash',
			error: `deploy failed with ${token} from /Users/alice/deploys\nsecond line`
		});

		const events = readLog();
		const fail = events[0] as { type: string; error: string };

		expect(fail.error).toContain('[redacted]');
		expect(fail.error).not.toContain('ghp_');
		expect(fail.error).not.toContain('/Users/alice');
		expect(fail.error).not.toContain('second line');
	});

	it('redacts an old raw log line before it reaches the context', () => {
		const token = 'ghp_' + 'a'.repeat(24);

		write(root, '.harness/state/hook-errors.log', `2026-11-01T00:00:00Z boom ${token} at /Users/alice/x\n`);

		const context = sessionStart();

		expect(context).toContain('the hook error log recorded');
		expect(context).not.toContain('ghp_');
		expect(context).not.toContain('/Users/alice');
	});
});

describe('stop hook', () => {
	it('returns nothing when stop_hook_active', () => {
		const { stdout, status } = hook({
			hook_event_name: 'Stop',
			session_id: 's1',
			stop_hook_active: true
		});

		expect(status).toBe(0);
		expect(stdout).toBe('');
	});

	it('asks for onboarding until an AskUserQuestion lands in the log', () => {
		write(root, '.harness/BOOTSTRAP.md', 'onboard\n');
		const first = stop();

		expect(contextOf(first.stdout)).toContain('harness-onboard');
		hook(
			toolPayload('AskUserQuestion', {
				questions: [{ question: 'Run /harness-onboard bootstrap ritual?' }]
			})
		);
		const second = stop();

		expect(contextOf(second.stdout)).toBe('');
	});

	it('asks for review after the tool-call threshold and a changed tree', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			review: { minToolCalls: 2 }
		});
		sessionStart();
		hook(toolPayload('Bash', { command: 'pnpm test' }));
		hook(toolPayload('Bash', { command: 'pnpm lint' }));
		write(root, 'src-new.ts', 'export {};\n');
		const first = stop();

		expect(contextOf(first.stdout)).toContain('harness-review');
		const second = stop();

		expect(contextOf(second.stdout)).toBe('');
	});

	it('asks for review on any failure since the last review', () => {
		sessionStart();
		hook({
			hook_event_name: 'PostToolUseFailure',
			session_id: 's1',
			tool_name: 'Bash',
			error: 'boom'
		});
		const { stdout } = stop();

		expect(contextOf(stdout)).toContain('harness-review');
	});

	it('does not ask for review without a git repository', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			review: { minToolCalls: 1 }
		});
		await exec('rm', ['-rf', '.git'], { cwd: root });
		sessionStart();
		hook(toolPayload('Bash', { command: 'pnpm test' }));
		write(root, 'src-new.ts', 'export {};\n');
		const { stdout } = stop();

		expect(contextOf(stdout)).toBe('');
	});

	it('does not log a hook error in a repository with no commit', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			review: { minToolCalls: 1 }
		});
		await exec('rm', ['-rf', '.git'], { cwd: root });
		await exec('git', ['init', '-q', '-b', 'main'], { cwd: root });
		sessionStart();
		hook(toolPayload('Bash', { command: 'pnpm test' }));
		stop();

		expect(existsSync(resolve(root, '.harness/state/hook-errors.log'))).toBe(false);
	});

	it('asks for curation on the interval with learned skills', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			curator: {
				...DEFAULT_CONFIG.curator,
				minLearnedSkills: 1
			}
		});
		learnedSkill('lesson-one');
		const { stdout } = stop();

		expect(contextOf(stdout)).toContain('harness-curate');
	});

	it('does not ask when the last curation is fresh', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			curator: {
				...DEFAULT_CONFIG.curator,
				minLearnedSkills: 1
			}
		});
		learnedSkill('lesson-one');
		write(root, '.harness/curator.json', JSON.stringify({ lastRun: dayOffset(0) }));
		const { stdout } = stop();

		expect(contextOf(stdout)).toBe('');
	});

	it('asks when memory passes the ratio and curation is a day old', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			memory: {
				...DEFAULT_CONFIG.memory,
				maxChars: 100
			}
		});
		write(root, '.harness/MEMORY.md', `# Memory\n- ${'x'.repeat(90)}\n`);
		write(root, '.harness/curator.json', JSON.stringify({ lastRun: dayOffset(2) }));
		const { stdout } = stop();

		expect(contextOf(stdout)).toContain('harness-curate');
	});

	it('writes curator.json when the session used harness-curate', () => {
		write(root, '.claude/skills/harness-curate/SKILL.md', 'body\n');
		hook(toolPayload('Skill', { skill: 'harness-curate' }));
		stop();

		const curator = JSON.parse(readFileSync(resolve(root, '.harness/curator.json'), 'utf8')) as {
			lastRun: string;
		};

		expect(curator.lastRun).toBe(dayOffset(0));
	});

	it('folds skill usage and prunes stale session logs', () => {
		write(root, '.claude/skills/harness-review/SKILL.md', 'body\n');
		hook(toolPayload('Skill', { skill: 'harness-review' }));
		const stale = resolve(root, '.harness/state/sessions/stale.jsonl');

		writeFileSync(stale, '{}\n');
		utimesSync(stale, STALE_MTIME, STALE_MTIME);
		stop();

		const usage = JSON.parse(readFileSync(resolve(root, '.harness/state/skill-usage.json'), 'utf8')) as Record<
			string,
			string
		>;

		expect(usage['harness-review']).toBe(dayOffset(0));
		expect(existsSync(stale)).toBe(false);
	});

	it('survives a truncated skill-usage file and rewrites it', () => {
		write(root, '.claude/skills/harness-review/SKILL.md', 'body\n');
		write(root, '.harness/state/skill-usage.json', '{"harness-review": "2026-');

		hook(toolPayload('Skill', { skill: 'harness-review' }));

		const { status } = stop();

		expect(status).toBe(0);

		const usage = JSON.parse(readFileSync(resolve(root, '.harness/state/skill-usage.json'), 'utf8')) as Record<
			string,
			string
		>;

		expect(usage['harness-review']).toBe(dayOffset(0));
	});

	it('asks for review when the worktree fingerprint fails', async () => {
		await makeRepo({
			...DEFAULT_CONFIG,
			review: { minToolCalls: 1 }
		});

		writeFileSync(resolve(root, '.git/index'), 'not an index');

		sessionStart();
		hook(toolPayload('Bash', { command: 'pnpm test' }));

		const { stdout } = stop();

		expect(contextOf(stdout)).toContain('harness-review');
	});
});
