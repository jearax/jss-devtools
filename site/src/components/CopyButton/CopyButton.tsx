import { Button, cn } from '@jjuidev/design-system';
import { Check, Copy } from 'lucide-react';
import { ComponentProps, useEffect, useRef, useState } from 'react';

import styles from './styles.module.css';

export type CopyButtonProps = Omit<ComponentProps<'button'>, 'value'> & {
	/** The text the button puts on the clipboard. */
	value: string;
	/** What the button copies, for the screen reader. */
	label: string;
};

/** How long the button says it copied, before it goes back to offering the copy. */
const COPIED_FOR_MS = 2000;

const CopyButton = ({ className, value, label, ...props }: CopyButtonProps) => {
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

	return (
		<Button
			className={cn(styles.root, className)}
			variant="ghost"
			size="sm"
			icon={isCopied ? <Check size={14} /> : <Copy size={14} />}
			iconPosition="start"
			aria-label={isCopied ? `Copied. ${label}` : label}
			onClick={() => {
				void copy();
			}}
			{...props}
		>
			{isCopied ? 'Copied' : 'Copy'}
		</Button>
	);
};

export default CopyButton;
