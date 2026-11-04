/**
 * A hand-written tokenizer for the three languages the site's snippets are written in.
 *
 * It exists to keep the dependency list short: a full highlighter would weigh more than the whole page
 * bundle, and the snippets here are small and known. The rules are per language and deliberately shallow.
 *
 * The contract every language keeps: the tokens of a snippet, joined, are the snippet. A highlighter that
 * drops or reorders a character corrupts the code it prints, so the scanner never skips a character and
 * never invents one.
 */

export type TokenRole = 'keyword' | 'string' | 'number' | 'comment' | 'punctuation' | 'property' | 'plain';

export type Token = {
	role: TokenRole;
	value: string;
};

export type Language = 'sh' | 'json' | 'ts';

type Spec = {
	comments: readonly RegExp[];
	strings: readonly RegExp[];
	number: RegExp;
	punctuation: RegExp;
	keywords: ReadonlySet<string>;
	/** A comment opens a word in a shell, so `a#b` is text and not a comment. */
	commentNeedsWordStart: boolean;
	/** A string followed by a colon is a key, not a value. */
	stringIsKey: boolean;
	/** A name after a dot is a member of the name before it. */
	memberAfterDot: boolean;
};

const SH_KEYWORDS = [
	'if',
	'then',
	'else',
	'elif',
	'fi',
	'for',
	'while',
	'until',
	'do',
	'done',
	'case',
	'esac',
	'in',
	'function',
	'select',
	'return',
	'break',
	'continue',
	'local',
	'export',
	'readonly',
	'declare',
	'source',
	'set',
	'unset',
	'trap',
	'shift',
	'exit'
];

const JSON_KEYWORDS = ['true', 'false', 'null'];

const TS_KEYWORDS = [
	'as',
	'async',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'declare',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'finally',
	'for',
	'from',
	'function',
	'if',
	'implements',
	'import',
	'in',
	'infer',
	'instanceof',
	'interface',
	'is',
	'keyof',
	'let',
	'namespace',
	'new',
	'null',
	'of',
	'private',
	'protected',
	'public',
	'readonly',
	'return',
	'satisfies',
	'static',
	'switch',
	'this',
	'throw',
	'true',
	'false',
	'try',
	'type',
	'typeof',
	'undefined',
	'var',
	'void',
	'while',
	'yield'
];

const SPECS: Record<Language, Spec> = {
	sh: {
		comments: [/#[^\n]*/y],
		strings: [/"(?:\\[\s\S]|[^"\\])*"/y, /'(?:\\[\s\S]|[^'\\])*'/y],
		number: /\d+(?:\.\d+)?/y,
		punctuation: /[{}()[\];|&<>=!]+/y,
		keywords: new Set(SH_KEYWORDS),
		commentNeedsWordStart: true,
		stringIsKey: false,
		memberAfterDot: false
	},
	json: {
		comments: [],
		strings: [/"(?:\\[\s\S]|[^"\\])*"/y],
		number: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y,
		punctuation: /[{}[\],:]+/y,
		keywords: new Set(JSON_KEYWORDS),
		commentNeedsWordStart: false,
		stringIsKey: true,
		memberAfterDot: false
	},
	ts: {
		comments: [/\/\/[^\n]*/y, /\/\*[\s\S]*?\*\//y],
		strings: [/"(?:\\[\s\S]|[^"\\])*"/y, /'(?:\\[\s\S]|[^'\\])*'/y, /`(?:\\[\s\S]|[^`\\])*`/y],
		number: /0[xX][\da-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y,
		punctuation: /[{}()[\];,.:?!<>=+\-*/%&|^~]+/y,
		keywords: new Set(TS_KEYWORDS),
		commentNeedsWordStart: false,
		stringIsKey: false,
		memberAfterDot: true
	}
};

const WORD = /[A-Za-z_$][\w$]*/y;

/** The characters a shell comment can follow, so `a#b` keeps its hash. */
const WORD_STARTS = new Set([' ', '\t', '\n', ';', '&', '|', '(', '{']);

const isLanguage = (value: string): value is Language => {
	return Object.hasOwn(SPECS, value);
};

const firstMatch = (code: string, index: number, patterns: readonly RegExp[]): string | null => {
	for (const pattern of patterns) {
		pattern.lastIndex = index;

		const match = pattern.exec(code);

		if (match !== null) {
			return match[0];
		}
	}

	return null;
};

const opensWord = (code: string, index: number): boolean => {
	if (index === 0) {
		return true;
	}

	const previous = code[index - 1];

	return previous !== undefined && WORD_STARTS.has(previous);
};

const isKey = (code: string, end: number): boolean => {
	let index = end;

	while (index < code.length) {
		const character = code[index];

		if (character === undefined || !/\s/.test(character)) {
			break;
		}

		index += 1;
	}

	return code[index] === ':';
};

const scan = (code: string, spec: Spec): Token[] => {
	const tokens: Token[] = [];
	let index = 0;
	let plain = '';

	const flush = () => {
		if (plain === '') {
			return;
		}

		tokens.push({
			role: 'plain',
			value: plain
		});
		plain = '';
	};

	while (index < code.length) {
		const comment = firstMatch(code, index, spec.comments);

		if (comment !== null && (!spec.commentNeedsWordStart || opensWord(code, index))) {
			flush();
			tokens.push({
				role: 'comment',
				value: comment
			});
			index += comment.length;
			continue;
		}

		const string = firstMatch(code, index, spec.strings);

		if (string !== null) {
			flush();
			const role: TokenRole = spec.stringIsKey && isKey(code, index + string.length) ? 'property' : 'string';

			tokens.push({
				role,
				value: string
			});
			index += string.length;
			continue;
		}

		spec.number.lastIndex = index;

		const number = spec.number.exec(code);

		if (number !== null && number[0] !== '') {
			flush();
			tokens.push({
				role: 'number',
				value: number[0]
			});
			index += number[0].length;
			continue;
		}

		WORD.lastIndex = index;

		const word = WORD.exec(code);

		if (word !== null) {
			flush();
			const value = word[0];

			const role: TokenRole = spec.keywords.has(value)
				? 'keyword'
				: spec.memberAfterDot && code[index - 1] === '.'
					? 'property'
					: 'plain';

			tokens.push({
				role,
				value
			});
			index += value.length;
			continue;
		}

		spec.punctuation.lastIndex = index;

		const punctuation = spec.punctuation.exec(code);

		if (punctuation !== null && punctuation[0] !== '') {
			flush();
			tokens.push({
				role: 'punctuation',
				value: punctuation[0]
			});
			index += punctuation[0].length;
			continue;
		}

		plain += code[index];
		index += 1;
	}

	flush();

	return tokens;
};

/**
 * The tokens of a snippet. A language the tokenizer does not know comes back as one plain token, so the
 * snippet still prints exactly as it was written.
 */
export const tokenize = (code: string, language: string): Token[] => {
	if (!isLanguage(language)) {
		return code === ''
			? []
			: [
					{
						role: 'plain',
						value: code
					}
				];
	}

	return scan(code, SPECS[language]);
};

/**
 * The tokens of a snippet, split by line. A token that spans lines, a block comment or a template
 * literal, is cut at the newline and each piece keeps its role.
 */
export const tokenizeLines = (code: string, language: string): Token[][] => {
	const lines: Token[][] = [];
	let current: Token[] = [];

	for (const token of tokenize(code, language)) {
		const parts = token.value.split('\n');

		parts.forEach((part, index) => {
			if (index > 0) {
				lines.push(current);
				current = [];
			}

			if (part !== '') {
				current.push({
					role: token.role,
					value: part
				});
			}
		});
	}

	lines.push(current);

	return lines;
};
