import { matchSorter } from 'match-sorter';

import { SEARCH_GROUPS, SearchEntry } from '@/constants/search-index.constant';

/**
 * The results for a query.
 *
 * An empty query shows the pages: they are the table of contents of the docs, and they are what
 * the reader wants before they know what to look for. A query matches the titles and the
 * keywords, and each word of the query narrows the list further.
 */
export const searchEntries = (entries: readonly SearchEntry[], query: string): SearchEntry[] => {
	const terms = query.split(/\s+/).filter(Boolean);

	if (terms.length === 0) {
		return entries.filter((entry) => {
			return entry.group === SEARCH_GROUPS.PAGES;
		});
	}

	// Each pass reorders the results, so the source position travels with the entry.
	const positioned = entries.map((entry, position) => {
		return {
			entry,
			position
		};
	});

	return terms
		.reduceRight((results, term) => {
			return matchSorter(results, term, {
				keys: [
					(item) => {
						return item.entry.title;
					},
					(item) => {
						return item.entry.keywords;
					}
				],
				baseSort: (first, second) => {
					return first.item.position - second.item.position;
				}
			});
		}, positioned)
		.map((item) => {
			return item.entry;
		});
};
