import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the Getting started page. The page asks for them by id, and the search index
 * reads this list, so a heading is declared once and never written out twice.
 */
export const SECTIONS = [
	{
		id: 'what-it-is',
		title: 'What it is'
	},
	{
		id: 'the-commands',
		title: 'The three commands'
	},
	{
		id: 'first-run',
		title: 'Your first run'
	},
	{
		id: 'next',
		title: 'Where to go next'
	}
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: SectionId): SectionMeta => {
	return sectionMeta(SECTIONS, id);
};
