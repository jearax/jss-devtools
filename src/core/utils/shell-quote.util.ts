export const shellQuote = (word: string): string => {
	return /^[\w@%+=:,./-]+$/.test(word) ? word : `'${word.replaceAll(`'`, `'\\''`)}'`;
};
