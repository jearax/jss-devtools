/**
 * The fields a Standard Schema issue carries for message lookup. Kept
 * structural so the app imports no type-only package of its own: under a
 * strict package manager, `@standard-schema/spec` resolves only from the
 * packages that depend on it.
 */
type ValidationIssue = {
	readonly message: string;
	readonly code?: unknown;
	readonly format?: unknown;
	readonly origin?: unknown;
};

/**
 * The candidate catalog keys for a validation issue, in lookup order: the
 * specific `<code>.<format>` and `<code>.<origin>` first, then `<code>`, and
 * finally `<code>.generic`, which the catalogs hold so an origin or format
 * without a dedicated message still reads translated.
 */
export const validationIssueKeys = (issue: ValidationIssue): string[] => {
	const base = typeof issue.code === 'string' ? issue.code : '';
	const keys: string[] = [];

	if (base === '') {
		return keys;
	}

	if (typeof issue.format === 'string') {
		keys.push(`${base}.${issue.format}`);
	}

	if (typeof issue.origin === 'string') {
		keys.push(`${base}.${issue.origin}`);
	}

	keys.push(base, `${base}.generic`);

	return keys;
};
