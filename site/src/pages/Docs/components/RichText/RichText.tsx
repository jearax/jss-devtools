import { Fragment } from 'react';

export interface RichTextProps {
	/** The text, with the code between backticks. */
	text: string;
}

/**
 * The text the constants carry, with the code between backticks. A constant is a string, so the
 * markup cannot live in it; the backtick is the only markup a constant uses, and this is the one
 * place that turns it into a `code` element.
 */
const RichText = ({ text }: RichTextProps) => {
	const parts = text.split('`');

	return (
		<>
			{parts.map((part, index) => {
				const isCode = index % 2 === 1;

				return <Fragment key={`${part}-${index}`}>{isCode ? <code>{part}</code> : part}</Fragment>;
			})}
		</>
	);
};

export default RichText;
