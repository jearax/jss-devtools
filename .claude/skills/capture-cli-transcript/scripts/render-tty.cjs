// Replays a raw TTY recording through a headless terminal and writes the final screen, with the
// SGR colour codes the site's ANSI renderer reads, to <recording>.screen.
// Usage: node render-tty.cjs <recording> <dir holding node_modules/@xterm/headless>
const { Terminal } = require(`${process.argv[3]}/node_modules/@xterm/headless`);
const fs = require('fs');

const data = fs.readFileSync(process.argv[2], 'latin1');
const term = new Terminal({ cols: 100, rows: 50, scrollback: 5000, allowProposedApi: true });

term.write(Buffer.from(data, 'latin1'), () => {
	const buffer = term.buffer.active;
	const lines = [];

	for (let y = 0; y < buffer.length; y++) {
		const row = buffer.getLine(y);
		let text = '';
		let previous = '';
		let lastStyled = 0;

		for (let x = 0; x < row.length; x++) {
			const cell = row.getCell(x);

			if (!cell || cell.getWidth() === 0) continue;

			const codes = [];

			if (cell.isBold()) codes.push(1);
			if (cell.isDim()) codes.push(2);
			if (cell.isInverse()) codes.push(7);
			if (cell.isFgPalette()) {
				const n = cell.getFgColor();
				codes.push(n < 8 ? 30 + n : 90 + n - 8);
			}

			const key = codes.join(';');

			if (key !== previous) {
				text += `\x1b[0m${key ? `\x1b[${key}m` : ''}`;
				previous = key;
			}

			text += cell.getChars() || ' ';

			// Inverse or coloured trailing spaces are part of the output (the inverse title ends in one).
			if (key !== '' || (cell.getChars() || ' ') !== ' ') lastStyled = text.length;
		}

		lines.push(text.slice(0, lastStyled) + (previous ? '\x1b[0m' : ''));
	}

	while (lines.length && lines[lines.length - 1].replace(/\x1b\[[\d;]*m/g, '').trim() === '') lines.pop();
	fs.writeFileSync(`${process.argv[2]}.screen`, `${lines.join('\n')}\n`);
});
