import { describe, expect, it } from 'vitest';

import { envSchema } from './env.schema.js';

describe('envSchema', () => {
	it('fills every variable from defaults, so the app boots without an environment file', () => {
		const values = envSchema.parse({});

		expect(values.NODE_ENV).toBe('local');
		expect(values.APP_PORT).toBe(3000);
		expect(values.LOG_LEVEL).toBe('info');
		expect(values.LOG_FORMAT).toBeUndefined();
		expect(values.DATABASE_URL).toBeUndefined();
		expect(values.APP_CORS_ORIGIN).toEqual(['*']);
	});

	it('splits APP_CORS_ORIGIN into trimmed origins', () => {
		expect(
			envSchema.parse({ APP_CORS_ORIGIN: 'https://a.example.com, https://b.example.com,' }).APP_CORS_ORIGIN
		).toEqual(['https://a.example.com', 'https://b.example.com']);
	});

	it('coerces and bounds APP_PORT from its string form', () => {
		const values = envSchema.parse({ APP_PORT: '8080' });

		expect(values.APP_PORT).toBe(8080);
		expect(() => {
			return envSchema.parse({ APP_PORT: '70000' });
		}).toThrow();
	});

	it('rejects an unknown NODE_ENV and an unknown LOG_LEVEL', () => {
		expect(() => {
			return envSchema.parse({ NODE_ENV: 'staging' });
		}).toThrow();
		expect(() => {
			return envSchema.parse({ LOG_LEVEL: 'verbose' });
		}).toThrow();
	});

	it('keeps LOG_FORMAT optional, so ConfigService can default it from NODE_ENV', () => {
		expect(envSchema.parse({ LOG_FORMAT: 'json' }).LOG_FORMAT).toBe('json');
		expect(envSchema.parse({}).LOG_FORMAT).toBeUndefined();
	});
});
