import { type Options } from 'pino-http';
import { describe, expect, it } from 'vitest';

import { type ConfigService } from '@/core/config/config.service.js';

import { loggerOptions } from './logger.options.js';

import type { IncomingMessage, ServerResponse } from 'node:http';

type LogFormat = 'json' | 'pretty';

const configWith = (nodeEnv: string, format: LogFormat): ConfigService => {
	return {
		logLevel: 'info',
		logFormat: format,
		nodeEnv
	} as ConfigService;
};

const pinoOptionsOf = (nodeEnv: string, format: LogFormat): Options => {
	const params = loggerOptions(configWith(nodeEnv, format));

	return params.pinoHttp as Options;
};

describe('loggerOptions', () => {
	it('runs pretty in local by default and json when NODE_ENV is prod', () => {
		const pretty = pinoOptionsOf('local', 'pretty').transport as {
			target?: string;
		};

		expect(pretty?.target).toBe('pino-pretty');
		expect(pinoOptionsOf('prod', 'json').transport).toBeUndefined();
	});

	it('redacts credentials and keeps the health route out of the request log', () => {
		const options = pinoOptionsOf('prod', 'json');
		const redact = options.redact as { paths: string[]; censor: string };

		expect(redact.paths).toEqual(
			expect.arrayContaining(['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'])
		);

		const autoLogging = options.autoLogging as {
			ignore: (req: { url?: string }) => boolean;
		};

		expect(autoLogging.ignore({ url: '/health/ready' })).toBe(true);
		expect(autoLogging.ignore({ url: '/samples' })).toBe(false);
	});

	it('skips only the health route itself and its subpaths, not lookalike routes', () => {
		const options = pinoOptionsOf('prod', 'json');

		const autoLogging = options.autoLogging as {
			ignore: (req: { url?: string }) => boolean;
		};

		expect(autoLogging.ignore({ url: '/health' })).toBe(true);
		expect(autoLogging.ignore({ url: '/health?verbose=1' })).toBe(true);
		expect(autoLogging.ignore({ url: '/health/ready?verbose=1' })).toBe(true);
		expect(autoLogging.ignore({ url: '/healthy-users' })).toBe(false);
		expect(autoLogging.ignore({ url: '/healthcare' })).toBe(false);
		expect(autoLogging.ignore({})).toBe(false);
	});

	it('logs a failed request as error, a rejected one as warn, the rest as info', () => {
		const levelOf = pinoOptionsOf('prod', 'json').customLogLevel;
		const req = {} as IncomingMessage;

		const withStatus = (statusCode: number): ServerResponse => {
			return { statusCode } as ServerResponse;
		};

		expect(levelOf?.(req, withStatus(200))).toBe('info');
		expect(levelOf?.(req, withStatus(404))).toBe('warn');
		expect(levelOf?.(req, withStatus(500))).toBe('error');
		expect(levelOf?.(req, withStatus(200), new Error('stream broke'))).toBe('error');
	});

	it('names a request by its method, path, status and time', () => {
		const options = pinoOptionsOf('prod', 'json');

		const req = {
			method: 'GET',
			url: '/',
			originalUrl: '/users?page=2'
		} as unknown as IncomingMessage;

		const res = { statusCode: 200 } as ServerResponse;

		expect(options.customSuccessMessage?.(req, res, 3)).toBe('GET /users?page=2 200 3ms');
		expect(options.customErrorMessage?.(req, { statusCode: 500 } as ServerResponse, new Error('x'))).toBe(
			'GET /users?page=2 500'
		);
	});

	it('leads a pretty line with its context and leaves the request objects to JSON', () => {
		const transport = pinoOptionsOf('local', 'pretty').transport as { options: Record<string, unknown> };

		expect(transport.options.messageFormat).toBe('{if context}[{context}] {end}{msg}');
		expect(transport.options.ignore).toBe('pid,hostname,context,req,res,responseTime');
	});

	it('reuses an incoming x-request-id, caps its length, and generates one otherwise', () => {
		const options = pinoOptionsOf('prod', 'json');

		const res = {
			setHeader: (name: string, value: string) => {
				expect(name).toBe('x-request-id');
				expect(value.length).toBeGreaterThan(0);
			}
		} as ServerResponse;

		const req = (headers: Record<string, string | string[]>) => {
			return { headers } as IncomingMessage;
		};

		expect(options.genReqId?.(req({ 'x-request-id': 'abc' }), res)).toBe('abc');
		expect(typeof options.genReqId?.(req({}), res)).toBe('string');
		expect(typeof options.genReqId?.(req({ 'x-request-id': 'x'.repeat(129) }), res)).toBe('string');
	});
});
