import { PackageManager } from 'nypm'

export const getPMExecCommand = (pm: PackageManager): string => {
	const PM_EXECUTORS = {
		npm: 'npx',
		pnpm: 'pnpm exec',
		yarn: 'yarn dlx',
		bun: 'bunx'
	}

	return PM_EXECUTORS[(pm.name || 'npm') as keyof typeof PM_EXECUTORS]
}
