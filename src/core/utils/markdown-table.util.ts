export type MarkdownRow = readonly string[];

const widthsOf = (header: MarkdownRow, rows: readonly MarkdownRow[]): readonly number[] => {
	return header.map((_, index) => {
		return Math.max(
			...rows.map((row) => {
				return row[index]?.length ?? 0;
			}),
			header[index]?.length ?? 0
		);
	});
};

/**
 * Renders a GitHub-flavoured Markdown table padded the way Prettier pads it: every column is as
 * wide as its longest cell, and the delimiter row is a run of dashes of that width. The installed
 * Markdown has to be Prettier output, so the padding cannot be left to a human.
 */
export const markdownTable = (header: MarkdownRow, rows: readonly MarkdownRow[]): string => {
	const widths = widthsOf(header, rows);

	const line = (cells: MarkdownRow): string => {
		return `| ${cells
			.map((cell, index) => {
				return cell.padEnd(widths[index] ?? 0);
			})
			.join(' | ')} |`;
	};

	return [
		line(header),
		line(
			widths.map((width) => {
				return '-'.repeat(width);
			})
		),
		...rows.map((row) => {
			return line(row);
		})
	].join('\n');
};
