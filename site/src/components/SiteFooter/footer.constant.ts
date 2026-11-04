import { SOURCE_URL } from '@/constants/cli.constant';
import { DOCS_PAGES, docsHref } from '@/constants/routes.constant';

export type FooterLink = {
	label: string;
	href: string;
	external: boolean;
};

export type FooterColumn = {
	heading: string;
	links: readonly FooterLink[];
};

/** The docs pages, by slug, so a column never retypes a page title the routes constant owns. */
const pageLink = (slug: string): FooterLink => {
	const page = DOCS_PAGES.find((candidate) => {
		return candidate.slug === slug;
	});

	return {
		label: page?.title ?? slug,
		href: docsHref(slug),
		external: false
	};
};

const externalLink = (label: string, href: string): FooterLink => {
	return {
		label,
		href,
		external: true
	};
};

/**
 * The footer's link columns, in atuin's spirit: plain groups of real pages, small enough to
 * never compete with the page above them.
 */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
	{
		heading: 'Product',
		links: [pageLink('getting-started'), pageLink('install')]
	},
	{
		heading: 'Commands',
		links: [pageLink('init'), pageLink('doctor'), pageLink('harness')]
	},
	{
		heading: 'Reference',
		links: [pageLink('reference'), externalLink('GitHub', SOURCE_URL)]
	}
];
