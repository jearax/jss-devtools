import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the init page. The page asks for them by id, and the search index reads this
 * list, so a heading is declared once and never written out twice.
 */
export const SECTIONS = [
	{
		id: 'what-it-does',
		title: 'What it does'
	},
	{
		id: 'the-flow',
		title: 'The flow'
	},
	{
		id: 'the-options',
		title: 'The options'
	},
	{
		id: 'the-files',
		title: 'The files it writes'
	},
	{
		id: 'the-scripts',
		title: 'The scripts it writes'
	},
	{
		id: 'the-presets',
		title: 'The presets'
	},
	{
		id: 'the-dry-run',
		title: 'The dry run'
	}
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: SectionId): SectionMeta => {
	return sectionMeta(SECTIONS, id);
};
