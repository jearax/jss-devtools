import { cn } from '@jjuidev/styles/variants';
import { ComponentProps, ReactNode } from 'react';

import { tokenizeLines } from '@/components/CodeBlock/highlight';
import WindowChrome from '@/components/WindowChrome/WindowChrome';

import styles from './styles.module.css';

export type CodeBlockProps = ComponentProps<'div'> & {
	/** The file name or the language, shown in the header. */
	title?: string;
	/** The snippet. */
	code: string;
	/** The shell prompt the snippet is typed at. */
	prompt?: string;
	/** Let a long line wrap instead of scrolling. */
	wrap?: boolean;
	/** The one-based line numbers to highlight. */
	highlighted?: readonly number[];
	/** What sits on the right of the header. */
	headerAction?: ReactNode;
	/** The language of the snippet: `sh`, `json` or `ts`. Anything else prints as plain text. */
	language?: string;
};

const CodeBlock = ({
	className,
	title,
	code,
	prompt,
	wrap = false,
	highlighted = [],
	headerAction,
	language,
	...props
}: CodeBlockProps) => {
	const lines = code.split('\n');
	const tokenLines = language === undefined ? null : tokenizeLines(code, language);

	const renderLine = (index: number): ReactNode => {
		const tokens = tokenLines?.[index];

		if (tokens === undefined) {
			return lines[index] ?? '';
		}

		return tokens.map((token, tokenIndex) => {
			return (
				<span key={`${token.role}-${tokenIndex}`} className={styles.token} data-role={token.role}>
					{token.value}
				</span>
			);
		});
	};

	return (
		<div className={cn(styles.root, className)} {...props}>
			<WindowChrome title={title}>{headerAction}</WindowChrome>
			<pre className={styles.code} data-wrap={wrap}>
				{prompt === undefined ? null : (
					<span className={styles.prompt}>
						{prompt} {renderLine(0)}
						{lines.length === 1 ? null : '\n'}
					</span>
				)}
				{lines.slice(prompt === undefined ? 0 : 1).map((line, index) => {
					const number = index + (prompt === undefined ? 1 : 2);

					return (
						<span key={`${line}-${index}`} className={styles.line} data-highlighted={highlighted.includes(number)}>
							{renderLine(index + (prompt === undefined ? 0 : 1))}
							{index === lines.length - (prompt === undefined ? 1 : 2) ? null : '\n'}
						</span>
					);
				})}
			</pre>
		</div>
	);
};

export default CodeBlock;
