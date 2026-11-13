import { NEST_TEMPLATE_FILES } from '@/commands/init/constants/nest-template.constant';
import { NODE_PRESET_DEPENDENCIES } from '@/commands/init/constants/node-preset-dependency.constant';

import { derivePackageName } from './plan.service';
import { sharedToolchainEntries } from './shared-toolchain-plan.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPreflight, PlanEntry } from '@/commands/init/types/init-plan.type';

const NEST_TEMPLATE_PACKAGE_JSON = 'package.json';
const NEST_APP_FOLDER = 'nest';
const NEST_APP_MODULE = 'src/app/app.module.ts';
const NO_SAMPLE_GITKEEP = 'src/domains/.gitkeep';
const COURSE_MODULE_IMPORT = "import { CourseModule } from '@/domains/learning/course/course.module.js';\n";
const COURSE_MODULE_ENTRY = ', CourseModule';

const SAMPLE_PATHS = [
	'src/core/i18n/locales/en/course.json',
	'src/core/i18n/locales/vi/course.json',
	'test/course.e2e-spec.ts'
];

const isSampleFile = (path: string): boolean => {
	return path.startsWith('src/domains/learning/') || SAMPLE_PATHS.includes(path);
};

// A missed match must fail the plan, not ship a module importing a dropped file.
const appModuleWithoutCourseModule = (path: string, raw: string): string => {
	if (!raw.includes(COURSE_MODULE_IMPORT)) {
		throw new Error(`the nest template ${path} has no CourseModule import to drop`);
	}

	const withoutImport = raw.replace(COURSE_MODULE_IMPORT, '');

	if (!withoutImport.includes(COURSE_MODULE_ENTRY)) {
		throw new Error(`the nest template ${path} does not list CourseModule in its imports`);
	}

	return withoutImport.replace(COURSE_MODULE_ENTRY, '');
};

type NestManifest = {
	name: string;
	devDependencies: Record<string, string>;
};

const planEntry = (path: string, content: string): PlanEntry => {
	return {
		action: 'create',
		path,
		content
	};
};

// The nest scripts run through the nest CLI (dev is `nest start --watch`, `nest build` rewrites the
// @/ paths), so the node preset's tsx runner and tsc-alias resolver have no call site in a nest app.
const NODE_ONLY_RUNTIME_TOOLS = ['tsc-alias', 'tsx'] as const;

const sharedDevDependencies = (): Record<string, string> => {
	return Object.fromEntries(
		Object.entries(NODE_PRESET_DEPENDENCIES)
			.filter(([name]) => {
				return !(NODE_ONLY_RUNTIME_TOOLS as readonly string[]).includes(name);
			})
			.map(([name, version]) => {
				return [name, `^${version}`];
			})
	);
};

const nestManifest = (packageName: string): string => {
	const raw = NEST_TEMPLATE_FILES[NEST_TEMPLATE_PACKAGE_JSON];

	if (raw === undefined) {
		throw new Error(`the embedded nest template has no ${NEST_TEMPLATE_PACKAGE_JSON}`);
	}

	const manifest = JSON.parse(raw) as NestManifest;

	return `${JSON.stringify(
		{
			...manifest,
			name: packageName,
			devDependencies: {
				...manifest.devDependencies,
				...sharedDevDependencies()
			}
		},
		null,
		'\t'
	)}\n`;
};

const nestTemplateEntries = (pathPrefix: string, packageName: string, sample: boolean): readonly PlanEntry[] => {
	const entries = Object.entries(NEST_TEMPLATE_FILES)
		.filter(([path]) => {
			return sample || !isSampleFile(path);
		})
		.map(([path, content]) => {
			const text =
				path === NEST_TEMPLATE_PACKAGE_JSON
					? nestManifest(packageName)
					: path === NEST_APP_MODULE && !sample
						? appModuleWithoutCourseModule(path, content)
						: content;

			return planEntry(`${pathPrefix}${path}`, text);
		});

	return sample ? entries : [...entries, planEntry(`${pathPrefix}${NO_SAMPLE_GITKEEP}`, '')];
};

export const nestCreateModeEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	const packageName = derivePackageName(preflight.projectName);
	const sample = options.sample !== false;

	return [...nestTemplateEntries('', packageName, sample), ...sharedToolchainEntries(preflight.pm, options.vscode)];
};

export const nestMonorepoAppEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	const packageName = derivePackageName(preflight.projectName);

	return nestTemplateEntries(
		`apps/${NEST_APP_FOLDER}/`,
		`@${packageName}/${NEST_APP_FOLDER}`,
		options.sample !== false
	);
};
