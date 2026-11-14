export type RedactionKind = 'secret' | 'private';

export type RedactionRule = {
	name: string;
	kind: RedactionKind;
	pattern: RegExp;
	replacement: string;
};

export type RedactionMatch = {
	rule: string;
	kind: RedactionKind;
	line: number;
};
