import { Button, cn } from '@jjuidev/design-system';
import { Search } from 'lucide-react';
import { ComponentProps } from 'react';

import { SEARCH_OPEN_EVENT, SEARCH_TRIGGER_LABEL } from '@/constants/search.constant';

import styles from './styles.module.css';

export interface SearchTriggerProps extends ComponentProps<'button'> {
	/** The keyboard hint the button shows. */
	shortcut?: string;
}

/**
 * The button that opens the search palette.
 *
 * It dispatches a DOM event rather than holding the palette's state, so the header and the
 * palette stay independently mountable: the palette lives in the layout, the trigger in the
 * header, and neither imports the other.
 */
const SearchTrigger = ({ className, shortcut = '⌘K', onClick, ...props }: SearchTriggerProps) => {
	return (
		<Button
			className={cn(styles.root, className)}
			variant="ghost"
			size="sm"
			aria-label={SEARCH_TRIGGER_LABEL}
			data-search-trigger="desktop"
			onClick={(...args) => {
				window.dispatchEvent(new Event(SEARCH_OPEN_EVENT));
				onClick?.(...args);
			}}
			{...props}
		>
			<Search className={styles.icon} size={15} aria-hidden="true" />
			<span className={styles.label}>Search</span>
			<kbd className={styles.shortcut}>{shortcut}</kbd>
		</Button>
	);
};

export default SearchTrigger;
