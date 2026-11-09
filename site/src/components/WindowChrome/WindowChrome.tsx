import { cn } from '@jjuidev/styles/variants';
import { ComponentProps, ReactNode } from 'react';

import styles from './styles.module.css';

export type WindowChromeProps = ComponentProps<'div'> & {
	/** The window's title: the command, the file, or the folder the window sits in. */
	title?: string | undefined;
	/** What sits on the right of the bar: a label, an action. */
	children?: ReactNode | undefined;
};

/**
 * The window chrome every terminal-like block wears: the three dots, the title bar. One component,
 * so the site's windows cannot drift apart in chrome.
 */
const WindowChrome = ({ className, title, children, ...props }: WindowChromeProps) => {
	return (
		<div className={cn(styles.bar, className)} {...props}>
			<span className={styles.dots} aria-hidden="true">
				<span className={styles.dot} data-tone="error" />
				<span className={styles.dot} data-tone="warning" />
				<span className={styles.dot} data-tone="success" />
			</span>
			{title === undefined ? null : <span className={styles.title}>{title}</span>}
			<span className={styles.spacer} />
			{children}
		</div>
	);
};

export default WindowChrome;
