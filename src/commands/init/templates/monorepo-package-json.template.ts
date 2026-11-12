import {
	MONOREPO_PRESET_DEPENDENCIES,
	NODE_PRESET_DEPENDENCIES
} from '@/commands/init/constants/node-preset-dependency.constant';

import { formatScript, type PackageManagerName } from './package-json.template';

export type MonorepoPackageJsonTemplateInput = {
	projectName: string;
	packageManager: PackageManagerName;
	packageManagerVersion: string;
	nodeFloor: string;
};

const SOURCE_FOLDERS =
	'{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}';

const WORKSPACE_FOLDERS = '{apps/*/{src,test,tools,e2e},packages/*/{src,test,tools}}';
const CODE_EXTENSIONS = 'cjs,mjs,js,jsx,cts,mts,ts,tsx';

const WORKSPACE_FILES = `{${WORKSPACE_FOLDERS},${SOURCE_FOLDERS}}/**/*.{${CODE_EXTENSIONS}}`;

const ROOT_FILES = `*.{${CODE_EXTENSIONS}}`;

const LINT_STAGED_SOURCES_KEY = `{{${WORKSPACE_FOLDERS},${SOURCE_FOLDERS}}/**/*,*}.{${CODE_EXTENSIONS}}`;

export const MONOREPO_LINT_STAGED = {
	[LINT_STAGED_SOURCES_KEY]: ['eslint --fix'],
	'**/!(package).{json,md,yml,yaml}': ['prettier --write'],
	'**/package.json': ['prettier-package-json --write', 'prettier --write']
};

export const monorepoPackageJsonTemplate = ({
	projectName,
	packageManager,
	packageManagerVersion,
	nodeFloor
}: MonorepoPackageJsonTemplateInput): string => {
	const devDependencies = Object.fromEntries(
		Object.entries({
			...NODE_PRESET_DEPENDENCIES,
			...MONOREPO_PRESET_DEPENDENCIES
		}).map(([name, version]) => {
			return [name, `^${version}`];
		})
	);

	const manifest = {
		name: projectName,
		version: '0.0.0',
		private: true,
		type: 'module',
		engines: {
			node: `>=${nodeFloor}`
		},
		packageManager: `${packageManager}@${packageManagerVersion}`,
		...(packageManager === 'pnpm' ? {} : { workspaces: ['apps/*', 'packages/*'] }),
		scripts: {
			dev: 'turbo run dev',
			build: 'turbo run build',
			typecheck: 'turbo run typecheck',
			lint: 'turbo run lint lint:root',
			'lint:root': `eslint "${ROOT_FILES}"`,
			'lint:fix': `eslint --fix "${WORKSPACE_FILES}" "${ROOT_FILES}"`,
			format: formatScript(packageManager),
			prepare: 'husky'
		},
		'lint-staged': MONOREPO_LINT_STAGED,
		devDependencies
	};

	return `${JSON.stringify(manifest, null, '\t')}\n`;
};
