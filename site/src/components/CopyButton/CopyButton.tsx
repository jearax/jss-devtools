import { Button, cn } from '@jjuidev/design-system';
import { Check, Copy } from 'lucide-react';
import { ComponentProps, useEffect, useRef, useState } from 'react';

import styles from './styles.module.css';

export type CopyButtonProps = Omit<ComponentProps<'button'>, 'value'> & {
	/** The text the button puts on the clipboard. */
	value: string;
	/** What the button copies, for the screen reader. */
	label: string;
	/**
	 * `icon` shows the Copy/Check swap only, with the status as a screen-reader line, the way the
	 * design system's `ButtonCopy` does it; the default shows the state as text beside the icon.
	 */
	feedback?: 'text' | 'icon';
};

/** How long the button says it copied, before it goes back to offering the copy. */
const COPIED_FOR_MS = 2000;

const CopyButton = ({ className, value, label, feedback = 'text', ...props }: CopyButtonProps) => {
	const [isCopied, setIsCopied] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			// The clipboard can be refused. The button then stays as it was, and the reader copies by hand.
			return;
		}

		setIsCopied(true);

		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			setIsCopied(false);
			timerRef.current = null;
		}, COPIED_FOR_MS);
	};

	const statusText = isCopied ? 'Copied' : 'Copy';
	const ariaLabel = isCopied ? `Copied. ${label}` : label;

	return (
		<Button
			className={cn(styles.root, className)}
			variant="ghost"
			size={feedback === 'icon' ? 'icon' : 'sm'}
			data-copied={isCopied}
			icon={isCopied ? <Check size={14} /> : <Copy size={14} />}
			iconPosition="start"
			aria-label={ariaLabel}
			onClick={() => {
				void copy();
			}}
			{...props}
		>
			{feedback === 'icon' ? null : statusText}
			{feedback === 'icon' && isCopied ? (
				<span className={styles.status} role="status">
					Copied
				</span>
			) : null}
		</Button>
	);
};

export default CopyButton;
