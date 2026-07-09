/**
 * Cross-platform path utilities using pathe
 * Provides consistent path handling across Windows, macOS, and Linux
 */

import {
	normalize as patheNormalize,
	join as patheJoin,
	resolve as patheResolve,
	relative as patheRelative
} from 'pathe'

/**
 * Normalize path separators and resolve . and ..
 * @param path - Path to normalize
 * @returns Normalized path with platform-specific separators
 */
export const normalizePath = (path: string): string => {
	return patheNormalize(path)
}

/**
 * Join path segments with platform-specific separators
 * @param segments - Path segments to join
 * @returns Joined path
 */
export const joinPath = (...segments: string[]): string => {
	return patheJoin(...segments)
}

/**
 * Resolve path segments to an absolute path
 * @param segments - Path segments to resolve
 * @returns Resolved absolute path
 */
export const resolvePath = (...segments: string[]): string => {
	return patheResolve(...segments)
}

/**
 * Get relative path from one path to another
 * @param from - Source path
 * @param to - Destination path
 * @returns Relative path from 'from' to 'to'
 */
export const relativePath = (from: string, to: string): string => {
	return patheRelative(from, to)
}
