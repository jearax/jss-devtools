import { describe, expect, it } from 'vitest';

import { Token, TokenRole, tokenize, tokenizeLines } from '@/components/CodeBlock/highlight';

const values = (tokens: Token[], role: TokenRole): string[] => {
	return tokens
		.filter((token) => {
			return token.role === role;
		})
		.map((token) => {
			return token.value;
		});
};

describe('the tokenizer', () => {
	it('reads a shell snippet', () => {
		const tokens = tokenize('# a note\nif [ -f file ]; then echo "ok" 42; fi\n', 'sh');

		expect(values(tokens, 'comment')).toEqual(['# a note']);
		expect(values(tokens, 'keyword')).toEqual(['if', 'then', 'fi']);
		expect(values(tokens, 'string')).toEqual(['"ok"']);
		expect(values(tokens, 'number')).toEqual(['42']);
	});

	it('reads a JSON object with a nested array', () => {
		const code = '{\n  "name": "jss",\n  "count": 42,\n  "tags": ["a", "b"],\n  "nested": { "on": true }\n}';
		const tokens = tokenize(code, 'json');

		expect(values(tokens, 'property')).toEqual(['"name"', '"count"', '"tags"', '"nested"', '"on"']);
		expect(values(tokens, 'string')).toEqual(['"jss"', '"a"', '"b"']);
		expect(values(tokens, 'number')).toEqual(['42']);
		expect(values(tokens, 'keyword')).toEqual(['true']);

		const punctuation = values(tokens, 'punctuation');

		expect(
			punctuation.filter((value) => {
				return value === ':';
			})
		).toHaveLength(5);
		expect(punctuation).toContain('{');
		expect(punctuation).toContain('[');
	});

	it('reads a TypeScript snippet', () => {
		const code = "import { cn } from '@jjuidev/design-system';\n\n// a note\nconst total = config.limit * 2;\n";
		const tokens = tokenize(code, 'ts');

		expect(values(tokens, 'keyword')).toEqual(['import', 'from', 'const']);
		expect(values(tokens, 'string')).toEqual(["'@jjuidev/design-system'"]);
		expect(values(tokens, 'comment')).toEqual(['// a note']);
		expect(values(tokens, 'number')).toEqual(['2']);
		expect(values(tokens, 'property')).toEqual(['limit']);
	});

	it('returns a language it does not know as one plain token', () => {
		expect(tokenize('print("hello")', 'python')).toEqual([
			{
				role: 'plain',
				value: 'print("hello")'
			}
		]);
	});

	it('never loses a character', () => {
		const samples: [string, string][] = [
			['sh', 'pnpm add -g @jjuidev/jss-devtools\nif [ "$CI" = "true" ]; then\n\techo "built >= 1.0"\nfi\n'],
			['json', '{"a":[1,2,{"b":null}],"c":"d"}'],
			['ts', 'const a = `x${1}`; // note\n/* block */\nconst b = a ?? "c";\n']
		];

		for (const [language, code] of samples) {
			const joined = tokenize(code, language)
				.map((token) => {
					return token.value;
				})
				.join('');

			expect(joined).toBe(code);
		}
	});

	it('splits the snippet into the lines it has', () => {
		const lines = tokenizeLines('a\nb\nc', 'ts');

		expect(lines).toHaveLength(3);
		expect(lines[1]?.[0]?.value).toBe('b');
	});
});
