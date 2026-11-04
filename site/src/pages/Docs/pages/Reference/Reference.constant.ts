import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the reference page. The page asks for them by id, and the search index reads
 * this list, so a heading is declared once and never written out twice.
 */
export const SECTIONS = [
	{
		id: 'the-commands',
		title: 'The commands'
	},
	{
		id: 'the-options',
		title: 'The init options'
	},
	{
		id: 'the-exit-codes',
		title: 'The exit codes'
	},
	{
		id: 'the-files',
		title: 'The files init owns'
	},
	{
		id: 'where-the-truth-lives',
		title: 'Where the truth lives'
	}
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: SectionId): SectionMeta => {
	return sectionMeta(SECTIONS, id);
};
