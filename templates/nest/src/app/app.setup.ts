import { HttpStatus, VersioningType, type INestApplication } from '@nestjs/common';
import { I18nService } from '@nestjs/i18n';

import { type ApiResponse } from '@/app/interfaces/api-response.interface.js';
import { type ConfigService } from '@/core/config/config.service.js';
import { i18nLocaleResolvers } from '@/core/i18n/i18n.module.js';

import type { NextFunction, Request, Response } from 'express';

export const API_PREFIX = 'api';
export const API_VERSION_DEFAULT = '1';
const UNPREFIXED_ROUTES = ['health'];

// Express answers any other path itself, past every Nest filter.
const reachesNest = (path: string): boolean => {
	return [API_PREFIX, ...UNPREFIXED_ROUTES].some((root) => {
		return path === `/${root}` || path.startsWith(`/${root}/`);
	});
};

const notFoundFallback = (app: INestApplication) => {
	const resolveLocale = async (req: Request): Promise<string | undefined> => {
		for (const resolver of i18nLocaleResolvers) {
			const candidates = await Promise.resolve(
				resolver.resolve({
					headers: req.headers,
					query: req.query
				})
			);

			const first = Array.isArray(candidates) ? candidates[0] : candidates;

			if (typeof first === 'string') {
				return first;
			}
		}

		return undefined;
	};

	return (req: Request, reply: Response, next: NextFunction): void => {
		if (reachesNest(req.path)) {
			next();
			return;
		}

		void (async (): Promise<void> => {
			const i18nService = app.get(I18nService);
			const locale = await resolveLocale(req);

			const body: ApiResponse<null> = {
				status: HttpStatus.NOT_FOUND,
				message:
					locale === undefined ? i18nService.translate('http.404') : i18nService.translate('http.404', { locale }),
				data: null
			};

			reply.status(HttpStatus.NOT_FOUND).json(body);
		})().catch(next);
	};
};

export const setupApp = (app: INestApplication, configService: ConfigService): void => {
	app.enableCors({ origin: configService.corsOrigin });
	app.setGlobalPrefix(API_PREFIX, {
		exclude: UNPREFIXED_ROUTES.map((root) => {
			return `${root}/{*splat}`;
		})
	});
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: API_VERSION_DEFAULT
	});
	app.use(notFoundFallback(app));
};
