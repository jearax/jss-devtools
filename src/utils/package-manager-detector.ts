/**
 * Package manager detection utilities
 * Auto-detects npm, yarn, pnpm, bun from lockfiles
 * Compatible with nypm's PackageManager interface
 */

import { existsSync } from 'node:fs'
import { cwd } from 'node:process'

// Re-export nypm's PackageManager type for compatibility
export type { PackageManager } from 'nypm'

// Internal type for detection
type PackageManagerType = 'npm' | 'yarn' | 'pnpm' | 'bun'

// nypm-compatible package manager objects
const packageManagers = {
	npm: { name: 'npm', command: 'npm', lockFile: 'package-lock.json' },
	yarn: { name: 'yarn', command: 'yarn', lockFile: 'yarn.lock', files: ['.yarnrc.yml'] },
	pnpm: { name: 'pnpm', command: 'pnpm', lockFile: 'pnpm-lock.yaml', files: ['pnpm-workspace.yaml'] },
	bun: { name: 'bun', command: 'bun', lockFile: ['bun.lockb', 'bun.lock'] }
}

/**
 * Detect the current package manager from lockfiles (nypm-compatible)
 * @returns Detected package manager object (async for nypm compatibility)
 */
export const detectPackageManager = async (): Promise<any> => {
	const cwdPath = cwd()

	if (existsSync(`${cwdPath}/bun.lockb`) || existsSync(`${cwdPath}/bun.lock`)) {
		return packageManagers.bun
	}
	if (existsSync(`${cwdPath}/pnpm-lock.yaml`)) {
		return packageManagers.pnpm
	}
	if (existsSync(`${cwdPath}/yarn.lock`)) {
		return packageManagers.yarn
	}
	if (existsSync(`${cwdPath}/package-lock.json`)) {
		return packageManagers.npm
	}

	return packageManagers.npm // default
}

/**
 * Get install command for a package manager (from name)
 * @param pmName - Package manager name
 * @returns Install command string
 */
export const getInstallCommand = (pmName: PackageManagerType): string => {
	const commands: Record<PackageManagerType, string> = {
		npm: 'npm install',
		yarn: 'yarn add',
		pnpm: 'pnpm add',
		bun: 'bun add'
	}
	return commands[pmName]
}

/**
 * Get dev install command for a package manager (from name)
 * @param pmName - Package manager name
 * @returns Dev install command string
 */
export const getDevInstallCommand = (pmName: PackageManagerType): string => {
	const commands: Record<PackageManagerType, string> = {
		npm: 'npm install --save-dev',
		yarn: 'yarn add --dev',
		pnpm: 'pnpm add --save-dev',
		bun: 'bun add --development'
	}
	return commands[pmName]
}

/**
 * Get execute command for a package manager (from name)
 * @param pmName - Package manager name
 * @returns Execute command string
 */
export const getExecuteCommand = (pmName: PackageManagerType): string => {
	const commands: Record<PackageManagerType, string> = {
		npm: 'npx',
		yarn: 'yarn',
		pnpm: 'pnpm exec',
		bun: 'bunx'
	}
	return commands[pmName]
}

/**
 * Get package manager name from package manager object
 * @param pm - Package manager object
 * @returns Package manager name
 */
export const getPackageManagerName = (pm: ReturnType<typeof detectPackageManager>): PackageManagerType => {
	if (pm && typeof pm === 'object' && 'name' in pm) {
		return (pm as any).name as PackageManagerType
	}
	return 'npm' // default
}
