export type AnsiColor = 'muted' | 'error' | 'success' | 'warning' | 'info' | 'primary';

export type AnsiSegment = {
	text: string;
	color: AnsiColor | null;
	dim: boolean;
	bold: boolean;
	inverse: boolean;
};

// Only the SGR codes the CLI prints are mapped; others are dropped, never shown as raw text.
const COLORS: Record<number, AnsiColor> = {
	31: 'error',
	32: 'success',
	33: 'warning',
	34: 'info',
	36: 'primary',
	90: 'muted',
	91: 'error',
	92: 'success',
	93: 'warning',
	94: 'info',
	96: 'primary'
};

const ESC = String.fromCodePoint(27);
const SGR = new RegExp(`${ESC}\\[([\\d;]*)m`);

export const parseAnsi = (line: string): AnsiSegment[] => {
	const state: Omit<AnsiSegment, 'text'> = {
		color: null,
		dim: false,
		bold: false,
		inverse: false
	};

	const segments: AnsiSegment[] = [];
	const parts = line.split(new RegExp(SGR.source, 'g'));

	parts.forEach((part, index) => {
		if (index % 2 === 0) {
			if (part !== '') {
				segments.push({
					text: part,
					...state
				});
			}

			return;
		}

		for (const code of (part === '' ? '0' : part).split(';').map(Number)) {
			if (code === 0) {
				Object.assign(state, {
					color: null,
					dim: false,
					bold: false,
					inverse: false
				});
			} else if (code === 1) {
				state.bold = true;
			} else if (code === 2) {
				state.dim = true;
			} else if (code === 22) {
				state.bold = false;
				state.dim = false;
			} else if (code === 7) {
				state.inverse = true;
			} else if (code === 27) {
				state.inverse = false;
			} else if (code === 39) {
				state.color = null;
			} else if (code in COLORS) {
				state.color = COLORS[code] ?? null;
			}
		}
	});

	return segments;
};

export const stripAnsi = (line: string) => {
	return line.replaceAll(new RegExp(SGR.source, 'g'), '');
};
