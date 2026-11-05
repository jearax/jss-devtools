export type DocsPage = {
	slug: string;
	title: string;
	summary: string;
	/**
	 * The group the page sits under in the sidebar, such as `Commands`. A page without a group
	 * is a top-level page, and its group label would only repeat its title.
	 */
	group?: string;
};

export const DOCS_BASE_PATH = '/docs';

export type DocsSidebarGroup = {
	/** The group's label, or `null` for the top-level pages that need no header. */
	label: string | null;
	/** The group's pages, in the reading order. */
	pages: readonly DocsPage[];
};

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
		summary: 'Create a project, or set up the folder you are in.',
		group: 'Commands'
	},
	{
		slug: 'doctor',
		title: 'doctor',
		summary: 'Check Node.js, git and the package managers.',
		group: 'Commands'
	},
	{
		slug: 'harness',
		title: 'harness',
		summary: 'The repository harness, and the agent workflow it installs.',
		group: 'Commands'
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

/**
 * The sidebar's groups, derived from the pages' own `group` field in the reading order. A pure
 * group header, `Commands`, is not a page: it names its children and never navigates, so it
 * never enters the pager or the search index either.
 */
export const DOCS_SIDEBAR_GROUPS: readonly DocsSidebarGroup[] = DOCS_PAGES.reduce<DocsSidebarGroup[]>(
	(groups, page) => {
		const last = groups[groups.length - 1];

		if (last !== undefined && last.label === (page.group ?? null)) {
			return [
				...groups.slice(0, -1),
				{
					...last,
					pages: [...last.pages, page]
				}
			];
		}

		return [
			...groups,
			{
				label: page.group ?? null,
				pages: [page]
			}
		];
	},
	[]
);
