import {
	DOCTOR_ALLOW_MARKER,
	EXEMPT_ACCOUNTS,
	EXEMPT_EMAIL_DOMAINS,
	EXEMPT_EMAIL_LOCAL_AT_DOMAINS,
	IMAGE_EXTENSIONS,
	REDACTION_RULES as RULES
} from '@/modules/harness/constants/redaction-rules.constant';

import type { RedactionRule, RedactionMatch } from '@/modules/harness/types/redaction.type';

const exemptEmail = (value: string): boolean => {
	const lowered = value.toLowerCase();

	if (EXEMPT_EMAIL_LOCAL_AT_DOMAINS.has(lowered)) {
		return true;
	}

	const domain = lowered.slice(lowered.lastIndexOf('@') + 1);

	if (EXEMPT_EMAIL_DOMAINS.has(domain)) {
		return true;
	}

	const lastLabel = domain.split('.').pop() ?? '';

	return IMAGE_EXTENSIONS.has(lastLabel);
};

const isExempt = (rule: RedactionRule, value: string): boolean => {
	if (rule.name === 'home-path') {
		const parts = value.split(/[/\\]/).filter((part) => {
			return part !== '';
		});

		return parts.length >= 2 && parts[1] !== undefined && EXEMPT_ACCOUNTS.has(parts[1]);
	}

	if (rule.name === 'email') {
		return exemptEmail(value);
	}

	if (rule.name === 'encoded-home-path') {
		const account = /-(?:Users|home)-([A-Za-z0-9._]{1,32})-$/.exec(value)?.[1];

		return account !== undefined && EXEMPT_ACCOUNTS.has(account);
	}

	return false;
};

export const redactLine = (text: string): string => {
	return RULES.reduce((acc, rule) => {
		return acc.replace(rule.pattern, (value) => {
			return isExempt(rule, value) ? value : rule.replacement;
		});
	}, text);
};

export type FindResult = {
	matches: RedactionMatch[];
	allowedLines: number;
};

export const findMatches = (text: string): FindResult => {
	const matches: RedactionMatch[] = [];
	let allowedLines = 0;

	for (const [index, line] of text.split('\n').entries()) {
		if (line.includes(DOCTOR_ALLOW_MARKER)) {
			allowedLines += 1;

			continue;
		}

		for (const rule of RULES) {
			for (const match of line.matchAll(rule.pattern)) {
				const value = match[0];

				if (value !== undefined && !isExempt(rule, value)) {
					matches.push({
						rule: rule.name,
						kind: rule.kind,
						line: index + 1
					});
				}
			}
		}
	}

	return {
		matches,
		allowedLines
	};
};

export const firstLine = (text: string): string => {
	return text.split(/\r?\n/, 1)[0] ?? '';
};
