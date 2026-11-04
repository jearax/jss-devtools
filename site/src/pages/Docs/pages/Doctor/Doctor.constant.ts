import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the doctor page. The page asks for them by id, and the search index reads this
 * list, so a heading is declared once and never written out twice.
 */
export const SECTIONS = [
	{
		id: 'what-it-checks',
		title: 'What it checks'
	},
	{
		id: 'the-output',
		title: 'The output'
	},
	{
		id: 'the-glyphs',
		title: 'The glyphs'
	},
	{
		id: 'the-exit-code',
		title: 'The exit code'
	}
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: SectionId): SectionMeta => {
	return sectionMeta(SECTIONS, id);
};
