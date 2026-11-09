import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { JSS_DEVTOOLS_SKIN } from '@/styles/skins/jss-devtools.skin';

import CodeBlock from './CodeBlock';

const SHELL = '# install\nif [ -f file ]; then echo "ok" 42; fi';
const JSON_SNIPPET = '{\n  "name": "jss",\n  "tags": ["a", "b"]\n}';
const TS_SNIPPET = "import { cn } from '@jjuidev/styles/variants';\n\nconst limit = 2;";

/** A snippet that carries every role, so the contrast of each one is measured. */
const EVERY_ROLE = 'const limit = config.max * 2; // a note\nconst name = "jss";';

const skinWrapper = ({ children }: { children: ReactNode }) => {
	return <ThemeProvider skins={[JSS_DEVTOOLS_SKIN]}>{children}</ThemeProvider>;
};

const parse = (value: string): [number, number, number] => {
	const numbers = value.match(/[\d.]+/g)?.map(Number) ?? [];
	const [red = 0, green = 0, blue = 0] = numbers;

	return [red, green, blue];
};

const luminance = ([red, green, blue]: [number, number, number]): number => {
	const channel = (value: number) => {
		const scaled = value / 255;

		return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
	};

	return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
};

const contrast = (first: string, second: string): number => {
	const brighter = Math.max(luminance(parse(first)), luminance(parse(second)));
	const darker = Math.min(luminance(parse(first)), luminance(parse(second)));

	return (brighter + 0.05) / (darker + 0.05);
};

describe('CodeBlock', () => {
	it('prints the snippet exactly as it was written', async () => {
		const snippets = [SHELL, JSON_SNIPPET, TS_SNIPPET, 'plain text with no language', 'a\nb\nc'];

		for (const code of snippets) {
			for (const language of ['sh', 'json', 'ts', 'python', undefined]) {
				const screen = await render(<CodeBlock code={code} {...(language === undefined ? {} : { language })} />, {
					wrapper: ThemeProvider
				});

				const pre = screen.container.querySelector('pre');

				expect(pre?.textContent).toBe(code);
			}
		}
	});

	it('prints the prompt and the snippet together', async () => {
		const screen = await render(<CodeBlock code={SHELL} prompt="$" language="sh" />, { wrapper: ThemeProvider });
		const pre = screen.container.querySelector('pre');

		expect(pre?.textContent).toBe(`$ ${SHELL}`);
	});

	it('colours the roles it knows', async () => {
		const screen = await render(<CodeBlock code={SHELL} language="sh" />, { wrapper: ThemeProvider });

		const roles = [...screen.container.querySelectorAll('[data-role]')].map((span) => {
			return span.getAttribute('data-role');
		});

		expect(roles).toContain('comment');
		expect(roles).toContain('keyword');
		expect(roles).toContain('string');
		expect(roles).toContain('number');
	});

	it('prints a language it does not know as plain text', async () => {
		const screen = await render(<CodeBlock code="print('hi')" language="python" />, { wrapper: ThemeProvider });

		const roles = [...screen.container.querySelectorAll('[data-role]')].map((span) => {
			return span.getAttribute('data-role');
		});

		expect(roles).toEqual(['plain']);
		expect(screen.container.querySelector('pre')?.textContent).toBe("print('hi')");
	});

	it('leaves the code alone when no language is given', async () => {
		const screen = await render(<CodeBlock code={SHELL} />, { wrapper: ThemeProvider });

		expect(screen.container.querySelectorAll('[data-role]')).toHaveLength(0);
	});

	it('still wraps a long line when asked', async () => {
		const screen = await render(<CodeBlock code={SHELL} wrap />, { wrapper: ThemeProvider });
		const pre = screen.container.querySelector('pre');

		expect(pre?.getAttribute('data-wrap')).toBe('true');
		expect(pre === null ? '' : getComputedStyle(pre).whiteSpace).toBe('pre-wrap');
	});

	it('still highlights the lines it is given', async () => {
		const screen = await render(<CodeBlock code={'a\nb\nc'} highlighted={[2]} />, { wrapper: ThemeProvider });
		const highlighted = screen.container.querySelector('[data-highlighted="true"]');

		expect(highlighted?.textContent).toBe('b\n');
	});

	it('keeps the ligatures off, so >= stays >=', async () => {
		const screen = await render(<CodeBlock code="echo a >= b" />, { wrapper: ThemeProvider });
		const pre = screen.container.querySelector('pre');

		expect(pre === null ? '' : getComputedStyle(pre).fontVariantLigatures).toBe('none');
		expect(pre?.textContent).toContain('>=');
	});

	it('keeps every role readable against the block, in both themes', async () => {
		document.cookie = `jds-skin=${JSS_DEVTOOLS_SKIN.id}`;

		const screen = await render(<CodeBlock code={EVERY_ROLE} language="ts" />, { wrapper: skinWrapper });
		const root = screen.container.firstElementChild;

		if (root === null) {
			throw new Error('the block did not render');
		}

		const spans = [...screen.container.querySelectorAll('[data-role]')];

		const roles = new Set(
			spans.map((span) => {
				return span.getAttribute('data-role');
			})
		);

		expect(roles).toEqual(new Set(['keyword', 'string', 'number', 'comment', 'property', 'punctuation', 'plain']));

		const theme = document.documentElement.dataset.theme;

		for (const name of ['light', 'dark']) {
			document.documentElement.dataset.theme = name;

			const background = getComputedStyle(root).backgroundColor;

			for (const span of spans) {
				const color = getComputedStyle(span).color;

				expect(contrast(color, background)).toBeGreaterThanOrEqual(4.5);
			}
		}

		document.documentElement.dataset.theme = theme;
	});
});
