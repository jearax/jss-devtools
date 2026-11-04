import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the Install page. The page asks for them by id, and the search index reads this
 * list, so a heading is declared once and never written out twice.
 */
export const SECTIONS = [
	{
		id: 'the-command',
		title: 'The command'
	},
	{
		id: 'what-it-needs',
		title: 'What it needs'
	},
	{
		id: 'what-it-writes',
		title: 'What it writes'
	},
	{
		id: 'moving-it',
		title: 'Moving it'
	},
	{
		id: 'uninstall',
		title: 'Uninstall'
	},
	{
		id: 'the-floor',
		title: 'The Node floor'
	}
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: SectionId): SectionMeta => {
	return sectionMeta(SECTIONS, id);
};
