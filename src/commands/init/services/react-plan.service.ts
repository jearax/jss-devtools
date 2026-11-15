import { REACT_TEMPLATE_FILES } from '@/commands/init/constants/react-template.constant';

import { derivePackageName } from './plan.service';
import { planEntry, templateManifest } from './shared-template-plan.service';
import { sharedToolchainEntries } from './shared-toolchain-plan.service';

import type { InitOptions } from '@/commands/init/types/init-options.type';
import type { InitPreflight, PlanEntry } from '@/commands/init/types/init-plan.type';

const REACT_APP_FOLDER = 'react';
const REACT_TEMPLATE_PACKAGE_JSON = 'package.json';
const REACT_INDEX_HTML = 'index.html';
const TITLE_PLACEHOLDER = '<title>react-app</title>';

const escapeHtmlText = (text: string): string => {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
};

// A missed match must fail the plan, like the nest module drop: shipping a page titled react-app
// is exactly the substitution failure the name substitution exists to prevent. The replacer is a
// function because a project name holding `$&` would be a replacement pattern in a string.
const reactIndexHtml = (raw: string, projectName: string): string => {
	if (!raw.includes(TITLE_PLACEHOLDER)) {
		throw new Error(`the react template index.html has no react-app title to rename`);
	}

	return raw.replace(TITLE_PLACEHOLDER, () => {
		return `<title>${escapeHtmlText(projectName)}</title>`;
	});
};

const reactTemplateEntries = (pathPrefix: string, packageName: string, projectName: string): readonly PlanEntry[] => {
	return Object.entries(REACT_TEMPLATE_FILES).map(([path, content]) => {
		const text =
			path === REACT_TEMPLATE_PACKAGE_JSON
				? templateManifest(REACT_TEMPLATE_FILES, packageName, 'react')
				: path === REACT_INDEX_HTML
					? reactIndexHtml(content, projectName)
					: content;

		return planEntry(`${pathPrefix}${path}`, text);
	});
};

export const reactCreateModeEntries = (preflight: InitPreflight, options: InitOptions): readonly PlanEntry[] => {
	const packageName = derivePackageName(preflight.projectName);

	return [
		...reactTemplateEntries('', packageName, preflight.projectName),
		...sharedToolchainEntries(preflight.pm, options.vscode)
	];
};

export const reactMonorepoAppEntries = (preflight: InitPreflight): readonly PlanEntry[] => {
	const packageName = derivePackageName(preflight.projectName);

	return reactTemplateEntries(
		`apps/${REACT_APP_FOLDER}/`,
		`@${packageName}/${REACT_APP_FOLDER}`,
		preflight.projectName
	);
};
