/**
 * Git repository detection utilities
 * Checks if current directory is a git repository
 */

import { existsSync } from 'node:fs'
import { cwd } from 'node:process'
import { join } from 'pathe'

/**
 * Check if current directory is a git repository
 * @returns true if .git directory exists
 */
export const isGitRepo = (): boolean => {
	const gitDir = join(cwd(), '.git')
	return existsSync(gitDir)
}

/**
 * Check if current directory is a git repository with full path
 * @param targetDir - Directory to check (defaults to cwd)
 * @returns true if .git directory exists
 */
export const isGitRepoAtPath = (targetDir: string = cwd()): boolean => {
	const gitDir = join(targetDir, '.git')
	return existsSync(gitDir)
}
