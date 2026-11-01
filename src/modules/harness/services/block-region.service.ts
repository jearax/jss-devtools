import { CliError } from '@/core/errors/cli.error';
import { HARNESS_BLOCK_BEGIN, HARNESS_BLOCK_END } from '@/modules/harness/constants/harness-paths.constant';

// A bare `=======` line is a Markdown heading, so only the labelled markers count.
const CONFLICT_MARKER_LINES = ['<<<<<<< ', '>>>>>>> '];

export const hasConflictMarkers = (text: string): boolean => {
	return text.split('\n').some((line) => {
		return CONFLICT_MARKER_LINES.some((marker) => {
			return line.startsWith(marker);
		});
	});
};

const lineIndexOf = (text: string, marker: string, from: number): number => {
	let index = text.indexOf(marker, from);

	while (index > 0 && text[index - 1] !== '\n') {
		index = text.indexOf(marker, index + 1);
	}

	return index;
};

type BlockSpan = {
	blockStart: number;
	start: number;
	end: number;
};

const markerSpan = (text: string): BlockSpan | null => {
	const blockStart = lineIndexOf(text, HARNESS_BLOCK_BEGIN, 0);

	if (blockStart === -1) {
		return null;
	}

	const afterBegin = text.indexOf('\n', blockStart);
	const start = afterBegin === -1 ? text.length : afterBegin + 1;
	const end = lineIndexOf(text, HARNESS_BLOCK_END, start);

	if (end === -1) {
		throw new CliError(`${HARNESS_BLOCK_BEGIN} has no following ${HARNESS_BLOCK_END}`);
	}

	const afterEnd = text.indexOf('\n', end);

	return {
		blockStart,
		start,
		end: afterEnd === -1 ? text.length : afterEnd + 1
	};
};

export const extractBlockUnit = (text: string): string | null => {
	const span = markerSpan(text);

	return span === null ? null : text.slice(span.start, span.end);
};

// Embeds `unit` between the markers; appends the block when absent; removes it when unit is null.
export const embedBlockUnit = (fileText: string, unit: string | null): string => {
	const span = markerSpan(fileText);

	if (span === null) {
		if (unit === null) {
			return fileText;
		}

		const separator = fileText === '' || fileText.endsWith('\n\n') ? '' : fileText.endsWith('\n') ? '\n' : '\n\n';

		return `${fileText}${separator}${HARNESS_BLOCK_BEGIN}\n${unit}${HARNESS_BLOCK_END}\n`;
	}

	if (unit === null) {
		return fileText.slice(0, span.blockStart) + fileText.slice(span.end);
	}

	return fileText.slice(0, span.start) + unit + fileText.slice(span.end);
};
