import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the harness page. The page asks for them by id, and the search index reads this
 * list, so a heading is declared once and never written out twice.
 */
export const SECTIONS = [
	{
		id: 'what-it-is',
		title: 'What it is'
	},
	{
		id: 'the-hooks',
		title: 'The hooks'
	},
	{
		id: 'the-file',
		title: 'The file it writes'
	},
	{
		id: 'knowledge',
		title: 'Private or shared knowledge',
		keywords: ['share-knowledge', '--share-knowledge', 'gitignored']
	},
	{
		id: 'security',
		title: 'Security',
		keywords: ['hook files', 'content check', 'harness-doctor: allow']
	},
	{
		id: 'session-start',
		title: 'At the start of a session'
	},
	{
		id: 'the-skills',
		title: 'The skills'
	},
	{
		id: 'the-commands',
		title: 'The commands'
	},
	{
		id: 'the-limits',
		title: 'The limits'
	}
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: SectionId): SectionMeta => {
	return sectionMeta(SECTIONS, id);
};
