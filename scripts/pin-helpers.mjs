import { execFileSync } from 'node:child_process';

export const MIN_AGE_MINUTES = 1440;

// The Nest-specific manifest entries of templates/nest/package.json. The shared toolchain
// (typescript, eslint, prettier, husky, ...) keeps its one home in NODE_PRESET_DEPENDENCIES
// and is merged at init; never list those here.
export const NEST_DEPENDENCIES = [
	'@nestjs/common',
	'@nestjs/config',
	'@nestjs/core',
	'@nestjs/i18n',
	'@nestjs/platform-express',
	'@nestjs/terminus',
	'nestjs-pino',
	'pino',
	'pino-http',
	'reflect-metadata',
	'rxjs',
	'zod'
];

export const NEST_DEV_DEPENDENCIES = [
	'@nestjs/cli',
	'@nestjs/schematics',
	'@nestjs/testing',
	'@types/express',
	'@types/supertest',
	'@vitest/coverage-v8',
	'pino-pretty',
	'source-map-support',
	'supertest',
	'vite',
	'vitest'
];

export const npmView = (args) => {
	return JSON.parse(
		execFileSync('npm', ['view', ...args, '--json'], {
			encoding: 'utf8',
			maxBuffer: 64 * 1024 * 1024
		})
	);
};

export const parseVersion = (version) => {
	const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);

	if (!match) {
		return null;
	}

	return [Number(match[1]), Number(match[2]), Number(match[3])];
};

export const compareVersions = (a, b) => {
	for (let i = 0; i < 3; i += 1) {
		if (a[i] !== b[i]) {
			return a[i] - b[i];
		}
	}

	return 0;
};

export const comparatorMin = (comparator) => {
	const match = /^(>=?|<=?|\^|~|=)?v?(\d+)(?:\.(\d+|x|X|\*))?(?:\.(\d+|x|X|\*))?$/.exec(comparator);

	if (!match) {
		return null;
	}

	const [, operator = '', major, minor = '0', patch = '0'] = match;

	if (operator.startsWith('<')) {
		return null;
	}

	return [
		Number(major),
		minor === 'x' || minor === 'X' || minor === '*' ? 0 : Number(minor),
		patch === 'x' || patch === 'X' || patch === '*' ? 0 : Number(patch)
	];
};

export const comparatorMaxExclusive = (comparator) => {
	const caret = /^\^v?(\d+)(?:\.(\d+|x|X|\*))?(?:\.(\d+|x|X|\*))?$/.exec(comparator);

	if (caret) {
		return [Number(caret[1]) + 1, 0, 0];
	}

	const tilde = /^~v?(\d+)\.(\d+|x|X|\*)(?:\.(\d+|x|X|\*))?$/.exec(comparator);

	if (tilde) {
		const minor = tilde[2] === 'x' || tilde[2] === 'X' || tilde[2] === '*' ? 0 : Number(tilde[2]);

		return [Number(tilde[1]), minor + 1, 0];
	}

	const less = /^<v?(\d+)\.(\d+|x|X|\*)(?:\.(\d+|x|X|\*))?$/.exec(comparator);

	if (less) {
		const minor = less[2] === 'x' || less[2] === 'X' || less[2] === '*' ? 0 : Number(less[2]);
		const patch = less[3] === undefined || less[3] === 'x' || less[3] === 'X' || less[3] === '*' ? 0 : Number(less[3]);

		return [Number(less[1]), minor, patch];
	}

	return null;
};

export const satisfiesComparator = (version, comparator) => {
	const parsed = parseVersion(version);

	if (!parsed) {
		return false;
	}

	const min = comparatorMin(comparator);

	if (min && compareVersions(parsed, min) < 0) {
		return false;
	}

	if (comparator.startsWith('>')) {
		if (comparator.startsWith('>=') === false && compareVersions(parsed, min ?? [0, 0, 0]) === 0) {
			return false;
		}
	}

	const max = comparatorMaxExclusive(comparator);

	if (max && compareVersions(parsed, max) >= 0) {
		return false;
	}

	if (
		/^=?v?\d/.test(comparator) &&
		!comparator.startsWith('<=') &&
		!comparator.startsWith('>=') &&
		!comparator.startsWith('<') &&
		!comparator.startsWith('>')
	) {
		const exact = comparator.replace(/^=/, '');

		if (parseVersion(exact) && compareVersions(parsed, parseVersion(exact)) !== 0) {
			return false;
		}
	}

	return true;
};

export const satisfies = (version, range) => {
	if (typeof range !== 'string') {
		return true;
	}

	return range.split('||').some((alternative) => {
		return alternative
			.trim()
			.split(/\s+/)
			.every((comparator) => {
				return satisfiesComparator(version, comparator);
			});
	});
};

export const rangeMinVersion = (range) => {
	if (typeof range !== 'string') {
		return [0, 0, 0];
	}

	const minimums = range
		.split('||')
		.flatMap((alternative) => {
			return alternative.trim().split(/\s+/).map(comparatorMin).filter(Boolean);
		})
		.sort(compareVersions);

	return minimums[0] ?? [0, 0, 0];
};

export const isStable = (version) => {
	return parseVersion(version) !== null;
};

export const isOldEnough = (publishedAt) => {
	return Date.now() - new Date(publishedAt).getTime() >= MIN_AGE_MINUTES * 60 * 1000;
};
