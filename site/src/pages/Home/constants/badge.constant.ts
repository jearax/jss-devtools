import { LICENSE, NODE_FLOOR, PLATFORM_SCOPE } from '@/constants/cli.constant';

export type BadgeFact = {
	/** What the fact is about. */
	label: string;
	/** The fact itself. */
	value: string;
};

/**
 * The thin band of facts under the hero. Each one is a fact the docs state in full; the band only
 * names them, so a reader knows what the CLI needs without reading a paragraph.
 */
export const BADGE_FACTS: readonly BadgeFact[] = [
	{
		label: 'License',
		value: LICENSE
	},
	{
		label: 'Node',
		value: `Node ${NODE_FLOOR}`
	},
	{
		label: 'Platform',
		value: PLATFORM_SCOPE
	}
];
