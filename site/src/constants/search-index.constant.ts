import { DOCS_PAGES, docsHref } from '@/constants/routes.constant';
import { SECTIONS as DOCTOR_SECTIONS } from '@/pages/Docs/pages/Doctor/Doctor.constant';
import { SECTIONS as GETTING_STARTED_SECTIONS } from '@/pages/Docs/pages/GettingStarted/GettingStarted.constant';
import { SECTIONS as HARNESS_SECTIONS } from '@/pages/Docs/pages/Harness/Harness.constant';
import { SECTIONS as INIT_SECTIONS } from '@/pages/Docs/pages/Init/Init.constant';
import { SECTIONS as INSTALL_SECTIONS } from '@/pages/Docs/pages/Install/Install.constant';
import { NEST_SECTIONS } from '@/pages/Docs/pages/Nest/Nest.constant';
import { SECTIONS as REFERENCE_SECTIONS } from '@/pages/Docs/pages/Reference/Reference.constant';

/**
 * The search index. It holds the titles and the anchors only: the pages themselves are lazy
 * routes, and this index must not pull their JSX into the main chunk. Every id and every title
 * comes from the page's own constant file, so a heading is declared once.
 */

export type SearchEntry = {
	/** A stable id for the entry. */
	id: string;
	/** What the result shows. */
	title: string;
	/** The group the result sits in. */
	group: string;
	/** The line under the title. */
	detail: string;
	/** Where the result goes. */
	href: string;
	/** The words the search matches on, beyond the title. */
	keywords: string[];
};

export const SEARCH_GROUPS = {
	PAGES: 'Pages',
	SECTIONS: 'Sections'
} as const;

const SECTION_LISTS = [
	{
		slug: 'getting-started',
		sections: GETTING_STARTED_SECTIONS
	},
	{
		slug: 'install',
		sections: INSTALL_SECTIONS
	},
	{
		slug: 'init',
		sections: INIT_SECTIONS
	},
	{
		slug: 'doctor',
		sections: DOCTOR_SECTIONS
	},
	{
		slug: 'harness',
		sections: HARNESS_SECTIONS
	},
	{
		slug: 'nest',
		sections: NEST_SECTIONS
	},
	{
		slug: 'reference',
		sections: REFERENCE_SECTIONS
	}
] as const;

const PAGE_BY_SLUG = new Map(
	DOCS_PAGES.map((page) => {
		return [page.slug, page];
	})
);

export const SEARCH_ENTRIES: readonly SearchEntry[] = [
	...DOCS_PAGES.map((page) => {
		return {
			id: `page-${page.slug}`,
			title: page.title,
			group: SEARCH_GROUPS.PAGES,
			detail: page.summary,
			href: docsHref(page.slug),
			keywords: [page.slug, page.title]
		};
	}),
	...SECTION_LISTS.flatMap(({ slug, sections }) => {
		const page = PAGE_BY_SLUG.get(slug);

		return sections.map((section) => {
			return {
				id: `${slug}-${section.id}`,
				title: section.title,
				group: SEARCH_GROUPS.SECTIONS,
				detail: page?.title ?? slug,
				href: `${docsHref(slug)}#${section.id}`,
				keywords: [slug, page?.title ?? slug, ...('keywords' in section ? section.keywords : [])]
			};
		});
	})
];
