import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog } from '@base-ui/react/dialog';
import { useHotkeys } from '@tanstack/react-hotkeys';
import { CornerDownLeft, FileText, Hash, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { searchEntries } from '@/components/SearchPalette/search.util';
import { SEARCH_ENTRIES, SearchEntry } from '@/constants/search-index.constant';
import {
	SEARCH_EMPTY_HREF,
	SEARCH_HOTKEY,
	SEARCH_INPUT_LABEL,
	SEARCH_LIST_LABEL,
	SEARCH_OPEN_EVENT,
	SEARCH_PALETTE_TITLE
} from '@/constants/search.constant';

import styles from './styles.module.css';

type ResultGroup = {
	value: string;
	items: SearchEntry[];
};

/*
 * The groups keep the order of their best-ranked entry, so the strongest match stays first.
 */
const groupResults = (results: readonly SearchEntry[]): ResultGroup[] => {
	const groups = new Map<string, SearchEntry[]>();

	for (const entry of results) {
		groups.set(entry.group, [...(groups.get(entry.group) ?? []), entry]);
	}

	return [...groups].map(([value, items]) => {
		return {
			value,
			items
		};
	});
};

const itemToStringValue = (entry: SearchEntry): string => {
	return entry.title;
};

/**
 * The docs search. It opens on the header's trigger or on the keyboard shortcut, filters the docs
 * index, and takes the reader to the page or the section they chose.
 */
const SearchPalette = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const navigate = useNavigate();
	const triggerRef = useRef<HTMLElement | null>(null);

	const open = useCallback(() => {
		/*
		 * The element that had the focus is the one that gets it back when the palette closes. When
		 * the palette was opened by the keyboard, there is no such element, and the header's trigger
		 * takes the focus instead.
		 */
		const active = document.activeElement;

		triggerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;

		setIsOpen(true);
	}, []);

	useEffect(() => {
		const onOpen = () => {
			open();
		};

		window.addEventListener(SEARCH_OPEN_EVENT, onOpen);

		return () => {
			window.removeEventListener(SEARCH_OPEN_EVENT, onOpen);
		};
	}, [open]);

	useHotkeys([
		{
			hotkey: SEARCH_HOTKEY,
			callback: () => {
				if (isOpen) {
					setIsOpen(false);

					return;
				}

				open();
			}
		}
	]);

	const results = useMemo(() => {
		return searchEntries(SEARCH_ENTRIES, query);
	}, [query]);

	const groups = useMemo(() => {
		return groupResults(results);
	}, [results]);

	const finalFocus = useCallback(() => {
		if (triggerRef.current !== null) {
			return triggerRef.current;
		}

		return document.querySelector<HTMLElement>('[data-search-trigger="desktop"]') ?? document.body;
	}, []);

	const select = (entry: SearchEntry) => {
		setIsOpen(false);
		void navigate(entry.href);
	};

	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					setQuery('');
				}

				setIsOpen(nextOpen);
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className={styles.backdrop} />
				{/*
				 * The popup is modal: the page behind it is inert while it is open. The package makes
				 * that true with a focus trap and inert markup, and this is the ARIA signal that says
				 * so.
				 */}
				<Dialog.Popup className={styles.popup} finalFocus={finalFocus} aria-modal="true">
					<Dialog.Title className={styles.title}>{SEARCH_PALETTE_TITLE}</Dialog.Title>

					<Autocomplete.Root
						open
						inline
						items={groups}
						filter={null}
						itemToStringValue={itemToStringValue}
						value={query}
						onValueChange={setQuery}
						autoHighlight="always"
						keepHighlight
					>
						<div className={styles.field}>
							<Search className={styles.fieldIcon} />
							<Autocomplete.Input
								className={styles.input}
								placeholder="Search the docs…"
								spellCheck={false}
								aria-label={SEARCH_INPUT_LABEL}
							/>
							<kbd className={styles.kbd}>Esc</kbd>
						</div>

						<div className={styles.results}>
							<Autocomplete.Empty className={styles.empty}>
								<p className={styles.emptyText}>No match for “{query}”.</p>
								<a className={styles.emptyLink} href={SEARCH_EMPTY_HREF}>
									Read the getting started guide
								</a>
							</Autocomplete.Empty>

							<Autocomplete.List className={styles.listbox} aria-label={SEARCH_LIST_LABEL}>
								{(group: ResultGroup) => {
									return (
										<Autocomplete.Group key={group.value} items={group.items} className={styles.group}>
											<Autocomplete.GroupLabel className={styles.groupTitle}>{group.value}</Autocomplete.GroupLabel>
											<Autocomplete.Collection>
												{(entry: SearchEntry) => {
													const Icon = entry.group === 'Pages' ? FileText : Hash;

													return (
														<Autocomplete.Item
															key={entry.id}
															value={entry}
															className={styles.option}
															onClick={() => {
																select(entry);
															}}
															render={(itemProps, state) => {
																/*
																 * The autocomplete leaves the selection off its options, so the
																 * highlighted one is marked here: it is the option the input
																 * points at, and that is what a screen reader has to hear.
																 */
																return (
																	<div {...itemProps} aria-selected={state.highlighted ? 'true' : 'false'}>
																		<Icon className={styles.optionIcon} />
																		<span className={styles.optionText}>
																			<span className={styles.optionTitle}>{entry.title}</span>
																			<span className={styles.optionDetail}>{entry.detail}</span>
																		</span>
																		<CornerDownLeft className={styles.optionEnter} />
																	</div>
																);
															}}
														/>
													);
												}}
											</Autocomplete.Collection>
										</Autocomplete.Group>
									);
								}}
							</Autocomplete.List>
						</div>

						<p className={styles.footer}>
							<span>
								<kbd className={styles.kbd}>↑</kbd> <kbd className={styles.kbd}>↓</kbd> to move
							</span>
							<span>
								<kbd className={styles.kbd}>↵</kbd> to open
							</span>
							<Autocomplete.Status className={styles.count}>
								{results.length} {results.length === 1 ? 'result' : 'results'}
							</Autocomplete.Status>
						</p>
					</Autocomplete.Root>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

export default SearchPalette;
