import { runCommand } from '@/core/utils/run-command.util';

export const AGENT_KIT_INIT_ARGS = ['init', '--docs-dir', '.harness/docs', '--plans-dir', '.harness/plans'] as const;

export const AGENT_KIT_INIT_COMMAND_LINE = ['ak', ...AGENT_KIT_INIT_ARGS].join(' ');

export type AgentKitVersion =
	{ status: 'ok' } | { status: 'missing'; problem: string } | { status: 'failed'; problem: string };

export const agentKitVersion = async (): Promise<AgentKitVersion> => {
	const result = await runCommand('ak', ['--version']);

	if (result.code === null) {
		return {
			status: 'missing',
			problem: 'ak is not installed'
		};
	}

	if (result.code !== 0) {
		return {
			status: 'failed',
			problem: `ak --version failed with exit code ${result.code}`
		};
	}

	return {
		status: 'ok'
	};
};

export const agentKitInit = async (cwd: string): Promise<boolean> => {
	const result = await runCommand('ak', [...AGENT_KIT_INIT_ARGS], { cwd });

	return result.code === 0;
};
