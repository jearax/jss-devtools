import { randomUUID } from 'node:crypto';
import { type IncomingMessage } from 'node:http';

import { type Params } from 'nestjs-pino';
import { type Options } from 'pino-http';

import { type ConfigService } from '@/core/config/config.service.js';

const REDACTED = '[Redacted]';
// Matches the health path exactly or any subpath; `/healthy-users` must still be logged.
const HEALTH_ROUTE = /^\/health(\/|$)/;
const MAX_REQUEST_ID_LENGTH = 128;
const CLIENT_ERROR = 400;
const SERVER_ERROR = 500;

// Express rewrites `req.url` inside routers; `originalUrl` is the path the client asked for.
const requestLine = (req: IncomingMessage & { originalUrl?: string }): string => {
	return `${req.method ?? ''} ${req.originalUrl ?? req.url ?? ''}`;
};

export const loggerOptions = (config: ConfigService): Params => {
	const pinoHttp: Options = {
		level: config.logLevel,
		redact: {
			paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
			censor: REDACTED
		},
		genReqId: (req, res) => {
			const incoming = req.headers['x-request-id'];

			if (typeof incoming === 'string' && incoming.length > 0 && incoming.length <= MAX_REQUEST_ID_LENGTH) {
				res.setHeader('x-request-id', incoming);
				return incoming;
			}

			const fresh = randomUUID();

			res.setHeader('x-request-id', fresh);
			return fresh;
		},
		// pino-http otherwise logs every request at `level`, failures included.
		customLogLevel: (_req, res, error) => {
			if (error !== undefined || res.statusCode >= SERVER_ERROR) {
				return 'error';
			}

			return res.statusCode >= CLIENT_ERROR ? 'warn' : 'info';
		},
		customSuccessMessage: (req, res, responseTime) => {
			return `${requestLine(req)} ${res.statusCode} ${responseTime}ms`;
		},
		customErrorMessage: (req, res) => {
			return `${requestLine(req)} ${res.statusCode}`;
		},
		autoLogging: {
			ignore: (req) => {
				return HEALTH_ROUTE.test((req.url ?? '').split('?')[0] ?? '');
			}
		}
	};

	if (config.logFormat === 'pretty') {
		pinoHttp.transport = {
			target: 'pino-pretty',
			options: {
				colorize: true,
				singleLine: true,
				messageFormat: '{if context}[{context}] {end}{msg}',
				ignore: 'pid,hostname,context,req,res,responseTime',
				translateTime: 'SYS:HH:MM:ss.l'
			}
		};
	}

	return { pinoHttp };
};
