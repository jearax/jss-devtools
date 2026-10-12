import { Agent, detect } from 'package-manager-detector'

export const SUPPORTED_AGENTS: readonly Agent[] = ['npm', 'pnpm', 'yarn', 'yarn@berry', 'bun']

const isSupported = (agent: Agent): boolean => SUPPORTED_AGENTS.includes(agent)

// Reads lockfiles, the packageManager field and devEngines, walking up from cwd.
export const detectProjectAgent = async (cwd: string): Promise<Agent | null> => {
	const detected = await detect({ cwd })

	return detected !== null && isSupported(detected.agent) ? detected.agent : null
}
