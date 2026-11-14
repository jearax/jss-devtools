import { describe, expect, it } from 'vitest';

import { REDACTION_RULES } from '@/modules/harness/constants/redaction-rules.constant';
import { findMatches, redactLine } from '@/modules/harness/services/redaction.service';

const SAMPLES: Record<string, string> = {
	'openai-key': `connect ${'sk-' + 'a'.repeat(12)} now`,
	'aws-key': `key ${'AKIA' + 'C'.repeat(16)} here`,
	'bearer-token': 'auth Bearer abc.def.ghi',
	'credential-assignment': 'token: super-secret-value',
	'github-token': `ghub ${'ghp_' + 'a'.repeat(24)} end`,
	'github-fine-grained-token': `pat ${'github_pat_' + 'a'.repeat(24)} end`,
	'slack-token': `slack ${'xoxb-' + 'a'.repeat(12)} end`,
	'slack-app-token': `app ${'xapp-' + 'a'.repeat(12)} end`,
	'gitlab-token': `gl ${'glpat-' + 'a'.repeat(16)} end`,
	'npm-token': `npm ${'npm_' + 'a'.repeat(24)} end`,
	'stripe-key': `pay ${'sk_' + 'live_' + 'a'.repeat(20)} end`,
	'google-api-key': `gcp ${'AIza' + 'a'.repeat(32)} end`,
	jwt: `token ${'eyJ' + 'a'.repeat(10)}.${'b'.repeat(10)}.${'c'.repeat(10)} end`,
	'private-key-header': '-----BEGIN PRIVATE KEY-----',
	'url-credentials': 'connect postgres://user:password@10.0.0.1/db',
	'home-path': 'lives at /Users/alice/projects/app',
	email: 'contact alice@corp.internal today'
};

describe('every rule matches its sample and skips its exemption', () => {
	it('finds one match per rule in its sample', () => {
		for (const rule of REDACTION_RULES) {
			const sample = SAMPLES[rule.name];

			expect(sample, `no sample for ${rule.name}`).toBeDefined();

			const { matches } = findMatches(sample as string);

			expect(
				matches.some((match) => {
					return match.rule === rule.name;
				}),
				`${rule.name} missed its sample`
			).toBe(true);
			expect(
				matches.find((match) => {
					return match.rule === rule.name;
				})?.kind
			).toBe(rule.kind);
		}
	});

	it('skips exempt home-path accounts and example e-mails', () => {
		expect(findMatches('reads /Users/user/config and /Users/me/notes').matches).toEqual([]);
		expect(findMatches('me@example.com and you@example.org').matches).toEqual([]);
		expect(findMatches('remote git@github.com:jjuidev/x.git').matches).toEqual([]);
		expect(findMatches('asset logo@2x.png is tiny').matches).toEqual([]);
	});

	it('reports the line number of each match', () => {
		const { matches } = findMatches('clean line\nemail bob@corp.internal here');

		expect(matches).toEqual([
			{
				rule: 'email',
				kind: 'private',
				line: 2
			}
		]);
	});
});

describe('the finder is stable and cheap', () => {
	it('returns the same result on the second call', () => {
		const text = 'token: abc123 and /Users/alice/work and dave@example.org';

		expect(findMatches(text)).toEqual(findMatches(text));
	});

	it('skips lines carrying the marker and counts them', () => {
		const result = findMatches(
			'token: abc123\nhome /Users/alice/x // harness-doctor: allow\ngit@github.com:jjuidev/x.git // harness-doctor: allow'
		);

		expect(result.matches).toEqual([
			{
				rule: 'credential-assignment',
				kind: 'secret',
				line: 1
			}
		]);
		expect(result.allowedLines).toBe(2);
	});

	it('finishes on a 200 kB line of one repeated character', () => {
		const start = Date.now();

		const result = findMatches('a'.repeat(200 * 1024));

		expect(result.matches).toEqual([]);
		expect(Date.now() - start).toBeLessThan(5000);
	});
});

describe('redactLine', () => {
	it('redacts a secret, keeps the tail of a home path behind ~/, and redacts an e-mail', () => {
		expect(redactLine('token: super-secret-value')).toBe('[redacted]');
		expect(redactLine('lives at /Users/alice/projects/app/src')).toBe('lives at ~/projects/app/src');
		expect(redactLine('mail alice@corp.internal ok')).toBe('mail [redacted] ok');
	});

	it('keeps exempt values as they are', () => {
		expect(redactLine('clone git@github.com:jjuidev/x.git today')).toBe('clone git@github.com:jjuidev/x.git today');
		expect(redactLine('found /Users/me/notes and me@example.com')).toBe('found /Users/me/notes and me@example.com');
	});
});
