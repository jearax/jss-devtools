import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MEMORY_WARN_RATIO } from './constants/harness-limits.constant';
import { HARNESS_MEMORY } from './constants/harness-paths.constant';

export type MemoryState = {
	exists: boolean;
	text: string;
	size: number;
	entries: string[];
};

const EMPTY_MEMORY: MemoryState = {
	exists: false,
	text: '',
	size: 0,
	entries: []
};

export const readMemoryState = (root: string): MemoryState => {
	const path = join(root, HARNESS_MEMORY);

	if (!existsSync(path)) {
		return EMPTY_MEMORY;
	}

	const text = readFileSync(path, 'utf8');

	return {
		exists: true,
		text,
		size: text.length,
		entries: text.split('\n').filter((line) => {
			return line.startsWith('- ');
		})
	};
};

export const memoryLimitProblems = (memory: MemoryState, maxChars: number, maxEntryChars: number): string[] => {
	const problems: string[] = [];

	if (memory.size > maxChars) {
		problems.push(`MEMORY.md is ${memory.size} chars, over the limit of ${maxChars}`);
	}

	for (const entry of memory.entries) {
		if (entry.length > maxEntryChars) {
			problems.push(
				`a memory entry is ${entry.length} chars, over the per-entry limit of ${maxEntryChars}: ${entry.slice(0, 60)}…`
			);
		}
	}

	return problems;
};

export const memoryNearCap = (size: number, maxChars: number): boolean => {
	return size >= MEMORY_WARN_RATIO * maxChars;
};
