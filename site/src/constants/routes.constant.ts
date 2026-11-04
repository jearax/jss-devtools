import { SOURCE_URL } from '@/constants/cli.constant';

export type NavItem = {
	label: string;
	href: string;
	/** The item that marks the current route. */
	current: boolean;
	external: boolean;
};

/**
 * The header's navigation. The routes and their order live here, so the header, the sidebar and
 * the previous/next links cannot drift apart.
 */
export const NAV_ITEMS: readonly NavItem[] = [
	{
		label: 'Home',
		href: '/',
		current: true,
		external: false
	},
	{
		label: 'Docs',
		href: '/docs',
		current: false,
		external: false
	},
	{
		label: 'GitHub',
		href: SOURCE_URL,
		current: false,
		external: true
	}
];

export type DocsPage = {
	slug: string;
	title: string;
	summary: string;
};

export const DOCS_BASE_PATH = '/docs';

/**
 * The Docs pages, in the sidebar's order. The route paths and the order live here, so the sidebar,
 * the router and the previous/next links cannot drift apart.
 */
export const DOCS_PAGES: readonly DocsPage[] = [
	{
		slug: 'getting-started',
		title: 'Getting started',
		summary: 'What the CLI is, and what its three commands do.'
	},
	{
		slug: 'install',
		title: 'Install',
		summary: 'The install command, what it needs, and what it writes.'
	},
	{
		slug: 'init',
		title: 'init',
		summary: 'Create a project, or set up the folder you are in.'
	},
	{
		slug: 'doctor',
		title: 'doctor',
		summary: 'Check Node.js, git and the package managers.'
	},
	{
		slug: 'harness',
		title: 'harness',
		summary: 'The repository harness, and the agent workflow it installs.'
	},
	{
		slug: 'reference',
		title: 'Reference',
		summary: 'The options, the presets and the exit codes.'
	}
];

export const docsHref = (slug: string): string => {
	return `${DOCS_BASE_PATH}/${slug}`;
};
