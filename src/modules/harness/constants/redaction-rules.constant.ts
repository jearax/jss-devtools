import type { RedactionRule } from '@/modules/harness/types/redaction.type';

// All patterns carry the g flag; the finder uses matchAll only, never test/exec, which keep lastIndex.
// Leading character classes are bounded so a long line cannot make a pattern quadratic.
const RULES: readonly RedactionRule[] = [
	{
		name: 'openai-key',
		kind: 'secret',
		pattern: /\bsk-[A-Za-z0-9_-]{8,}/g,
		replacement: '[redacted]'
	},
	{
		name: 'aws-key',
		kind: 'secret',
		pattern: /\bA[KS]IA[0-9A-Z]{16}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'bearer-token',
		kind: 'secret',
		pattern: /\bBearer\s+\S+/gi,
		replacement: '[redacted]'
	},
	{
		name: 'credential-assignment',
		kind: 'secret',
		pattern: /\b(?:api[_-]?key|token|password|secret|authorization)["']?\s*[:=]\s*\S+/gi,
		replacement: '[redacted]'
	},
	{
		name: 'github-token',
		kind: 'secret',
		pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'github-fine-grained-token',
		kind: 'secret',
		pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'slack-token',
		kind: 'secret',
		pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'slack-app-token',
		kind: 'secret',
		pattern: /\bxapp-[A-Za-z0-9-]{10,}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'gitlab-token',
		kind: 'secret',
		pattern: /\bglpat-[A-Za-z0-9_-]{15,}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'npm-token',
		kind: 'secret',
		pattern: /\bnpm_[A-Za-z0-9]{20,}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'stripe-key',
		kind: 'secret',
		pattern: /\b[sr]k_live_[A-Za-z0-9]{15,}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'google-api-key',
		kind: 'secret',
		pattern: /\bAIza[A-Za-z0-9_-]{30,}\b/g,
		replacement: '[redacted]'
	},
	{
		name: 'jwt',
		kind: 'secret',
		pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
		replacement: '[redacted]'
	},
	{
		name: 'private-key-header',
		kind: 'secret',
		pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
		replacement: '[redacted]'
	},
	{
		name: 'url-credentials',
		kind: 'secret',
		pattern: /\b[a-z][a-z0-9+.-]{0,15}:\/\/[^\s:@/]{1,64}:[^\s@/]{1,128}@[^\s/]{1,255}/g,
		replacement: '[redacted]'
	},
	{
		name: 'home-path',
		kind: 'private',
		pattern: /(?:\/Users\/|\/home\/|C:\\Users\\)[A-Za-z0-9._-]+(?:\/|\\)/g,
		replacement: '~/'
	},
	{
		name: 'encoded-home-path',
		kind: 'private',
		pattern: /(?<![A-Za-z0-9-])(?:[A-Z]-)?-(?:Users|home)-[A-Za-z0-9._]{1,32}-/g,
		replacement: '-Users-<account>-'
	},
	{
		name: 'email',
		kind: 'private',
		pattern: /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,24}/g,
		replacement: '[redacted]'
	}
];

export const REDACTION_RULES = RULES;

export const DOCTOR_ALLOW_MARKER = 'harness-doctor: allow';

// Placeholder and shared-machine account names are not private.
export const EXEMPT_ACCOUNTS = new Set([
	'<name>',
	'name',
	'user',
	'username',
	'you',
	'me',
	'tester',
	'node',
	'runner',
	'ubuntu',
	'Shared'
]);

export const EXEMPT_EMAIL_DOMAINS = new Set(['example.com', 'example.org', 'example.net', 'example.test']);

export const EXEMPT_EMAIL_LOCAL_AT_DOMAINS = new Set(['git@github.com', 'git@gitlab.com', 'git@bitbucket.org']);

export const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif']);
