import { readFileSync, writeFileSync } from 'node:fs';

import { readPackageInfo } from './package-info.mjs';
import {
	MIN_AGE_MINUTES,
	NEST_DEPENDENCIES,
	NEST_DEV_DEPENDENCIES,
	REACT_DEPENDENCIES,
	REACT_DEV_DEPENDENCIES,
	compareVersions,
	isOldEnough,
	isStable,
	npmView,
	parseVersion,
	rangeMinVersion,
	satisfies
} from './pin-helpers.mjs';

const PACKAGES = [
	'@commitlint/cli',
	'@commitlint/config-conventional',
	'@eslint/js',
	'@types/node',
	'eslint',
	'eslint-config-prettier',
	'eslint-plugin-autofix',
	'eslint-plugin-import-x',
	'eslint-plugin-prefer-arrow-functions',
	'eslint-plugin-prettier',
	'globals',
	'husky',
	'lint-staged',
	'prettier',
	'prettier-package-json',
	'tsc-alias',
	'tsx',
	'typescript',
	'typescript-eslint'
];

const MONOREPO_PACKAGES = ['turbo'];

const NODE_FLOOR = readPackageInfo().nodeFloor;
const TYPES_NODE_MAJOR = Number(NODE_FLOOR.split('.')[0]);
// The compiler toolchain is built against Babel 7; major 8 exists but is not proven on this
// template. Pinned to its fixed major the way @types/node follows the node floor.
const BABEL_CORE_MAJOR = 7;

const FIXED_MAJORS = {
	'@types/node': TYPES_NODE_MAJOR,
	'@babel/core': BABEL_CORE_MAJOR
};

const ALL_PINNED = [
	...new Set([
		...PACKAGES,
		...NEST_DEPENDENCIES,
		...NEST_DEV_DEPENDENCIES,
		...REACT_DEPENDENCIES,
		...REACT_DEV_DEPENDENCIES
	])
];

const registry = {};

for (const pkg of [...ALL_PINNED, ...MONOREPO_PACKAGES]) {
	const { time, versions, 'dist-tags': distTags } = npmView([pkg, 'time', 'versions', 'dist-tags']);

	registry[pkg] = {
		stableVersions: versions.filter(isStable).sort((a, b) => {
			return compareVersions(parseVersion(a), parseVersion(b));
		}),
		time,
		latest: distTags.latest
	};
}

const versionMetadata = {};

const fetchVersionMetadata = (pkg, version) => {
	versionMetadata[pkg] ??= {};
	versionMetadata[pkg][version] ??= npmView([`${pkg}@${version}`]);

	return versionMetadata[pkg][version];
};

const candidates = (pkg) => {
	const fixedMajor = FIXED_MAJORS[pkg];

	if (fixedMajor !== undefined) {
		return registry[pkg].stableVersions
			.filter((version) => {
				return parseVersion(version)[0] === fixedMajor;
			})
			.reverse();
	}

	return [...registry[pkg].stableVersions].reverse();
};

const chosen = Object.fromEntries(
	ALL_PINNED.map((pkg) => {
		return [pkg, candidates(pkg)[0]];
	})
);

const stepsDown = Object.fromEntries(
	ALL_PINNED.map((pkg) => {
		return [pkg, 0];
	})
);

const peerConflict = () => {
	for (const pkg of ALL_PINNED) {
		const { peerDependencies } = fetchVersionMetadata(pkg, chosen[pkg]);

		for (const [dep, range] of Object.entries(peerDependencies ?? {})) {
			if (dep in chosen && !satisfies(chosen[dep], range)) {
				return {
					pkg,
					dep,
					range
				};
			}
		}
	}

	return null;
};

let pass = 0;

for (;;) {
	pass += 1;

	if (pass > 200) {
		throw new Error('peer resolution did not converge');
	}

	const conflict = peerConflict();

	if (!conflict) {
		break;
	}

	const alternatives = candidates(conflict.dep).filter((version) => {
		return compareVersions(parseVersion(version), parseVersion(chosen[conflict.dep])) < 0;
	});

	const fitting = alternatives.find((version) => {
		return satisfies(version, conflict.range) && isOldEnough(registry[conflict.dep].time[version]);
	});

	if (!fitting) {
		throw new Error(
			`no version of ${conflict.dep} satisfies '${conflict.range}' wanted by ${conflict.pkg}@${chosen[conflict.pkg]}`
		);
	}

	chosen[conflict.dep] = fitting;
	stepsDown[conflict.dep] += 1;
}

for (const pkg of ALL_PINNED) {
	while (!isOldEnough(registry[pkg].time[chosen[pkg]])) {
		const older = candidates(pkg).find((version) => {
			return compareVersions(parseVersion(version), parseVersion(chosen[pkg])) < 0;
		});

		if (!older) {
			throw new Error(`${pkg} has no stable release older than ${MIN_AGE_MINUTES} minutes`);
		}

		chosen[pkg] = older;
		stepsDown[pkg] += 1;
	}
}

const stalePeer = peerConflict();

if (stalePeer) {
	throw new Error(
		`peer conflict after the age step-down: ${stalePeer.dep} '${stalePeer.range}' wanted by ${stalePeer.pkg}@${chosen[stalePeer.pkg]}`
	);
}

const engineViolations = ALL_PINNED.filter((pkg) => {
	const { engines } = fetchVersionMetadata(pkg, chosen[pkg]);

	return engines?.node && compareVersions(rangeMinVersion(engines.node), parseVersion(NODE_FLOOR)) > 0;
});

if (engineViolations.length > 0) {
	throw new Error(`engines.node above the ${NODE_FLOOR} floor: ${engineViolations.join(', ')}`);
}

const highestNode = Math.max(
	...ALL_PINNED.map((pkg) => {
		return rangeMinVersion(fetchVersionMetadata(pkg, chosen[pkg]).engines?.node ?? '>=0')[0];
	})
);

console.table(
	ALL_PINNED.map((pkg) => {
		return {
			package: pkg,
			version: chosen[pkg],
			'latest is': registry[pkg].latest,
			stepsDown: stepsDown[pkg]
		};
	})
);
console.log(
	`node floor: ${NODE_FLOOR}; highest package engines.node floor major: ${highestNode}; peer passes: ${pass}`
);

const monorepoChosen = {};

for (const pkg of MONOREPO_PACKAGES) {
	let version = candidates(pkg)[0];

	while (!isOldEnough(registry[pkg].time[version])) {
		const older = candidates(pkg).find((candidate) => {
			return compareVersions(parseVersion(candidate), parseVersion(version)) < 0;
		});

		if (!older) {
			throw new Error(`${pkg} has no stable release older than ${MIN_AGE_MINUTES} minutes`);
		}

		version = older;
	}

	monorepoChosen[pkg] = version;

	const { engines } = fetchVersionMetadata(pkg, version);

	if (engines?.node && compareVersions(rangeMinVersion(engines.node), parseVersion(NODE_FLOOR)) > 0) {
		throw new Error(`${pkg} engines.node above the ${NODE_FLOOR} floor`);
	}
}

const quoteKey = (key) => {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : `'${key}'`;
};

const renderDependencyTable = (entries) => {
	const lines = Object.entries(entries).map(([name, version]) => {
		return `\t${quoteKey(name)}: '${version}'`;
	});

	return lines.join(',\n');
};

const constantsPath = new URL('../src/commands/init/constants/node-preset-dependency.constant.ts', import.meta.url);

writeFileSync(
	constantsPath,
	`// Written by scripts/pin-node-preset.mjs; rerun it instead of editing by hand.
export const NODE_PRESET_DEPENDENCIES = {
${renderDependencyTable(
	Object.fromEntries(
		PACKAGES.map((pkg) => {
			return [pkg, chosen[pkg]];
		})
	)
)}
} as const;

export const MONOREPO_PRESET_DEPENDENCIES = {
${renderDependencyTable(monorepoChosen)}
} as const;
`
);

console.log(`wrote ${constantsPath.pathname}`);

const TEMPLATES = [
	{
		name: 'nest',
		dependencies: NEST_DEPENDENCIES,
		devDependencies: NEST_DEV_DEPENDENCIES
	},
	{
		name: 'react',
		dependencies: REACT_DEPENDENCIES,
		devDependencies: REACT_DEV_DEPENDENCIES
	}
];

const sortByName = (entries) => {
	return Object.fromEntries(
		Object.entries(entries).sort(([a], [b]) => {
			return a.localeCompare(b);
		})
	);
};

for (const template of TEMPLATES) {
	const manifestPath = new URL(`../templates/${template.name}/package.json`, import.meta.url);
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

	for (const pkg of [...template.dependencies, ...template.devDependencies]) {
		if (!chosen[pkg]) {
			throw new Error(`${pkg} was not pinned`);
		}
	}

	for (const pkg of template.dependencies) {
		manifest.dependencies ??= {};
		manifest.dependencies[pkg] = `^${chosen[pkg]}`;
	}

	for (const pkg of template.devDependencies) {
		manifest.devDependencies ??= {};
		manifest.devDependencies[pkg] = `^${chosen[pkg]}`;
	}

	manifest.dependencies = sortByName(manifest.dependencies);
	manifest.devDependencies = sortByName(manifest.devDependencies);

	writeFileSync(manifestPath, `${JSON.stringify(manifest, null, '\t')}\n`);

	console.log(`wrote ${manifestPath.pathname}`);
}
