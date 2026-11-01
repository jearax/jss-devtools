const SECRET_PATTERNS: readonly RegExp[] = [
	/\bsk-[A-Za-z0-9_-]{8,}/g,
	/\bAKIA[0-9A-Z]{16}\b/g,
	/\bBearer\s+\S+/gi,
	/\b(?:api[_-]?key|token|password|secret|authorization)["']?\s*[:=]\s*\S+/gi
];

export const redactSecrets = (text: string): string => {
	return SECRET_PATTERNS.reduce((acc, pattern) => {
		return acc.replace(pattern, '[redacted]');
	}, text);
};

export const firstLine = (text: string): string => {
	return text.split(/\r?\n/, 1)[0] ?? '';
};
