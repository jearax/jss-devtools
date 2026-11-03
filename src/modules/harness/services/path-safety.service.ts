import { isAbsolute, resolve, sep } from 'node:path';

import { CliError } from '@/core/errors/cli.error';

const staysInside = (root: string, path: string): boolean => {
	if (path === '' || isAbsolute(path)) {
		return false;
	}

	if (path.split(/[/\\]/).includes('..')) {
		return false;
	}

	const base = resolve(root);

	return resolve(base, path).startsWith(base + sep);
};

export const assertRepositoryPath = (root: string, path: string, source: string, hint: string): void => {
	if (staysInside(root, path)) {
		return;
	}

	throw new CliError(`${source} names a path outside the repository: ${path}`, { hint });
};
