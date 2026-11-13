import { HttpStatus, VersioningType, type INestApplication } from '@nestjs/common';
import { I18nService } from '@nestjs/i18n';

import { type ApiResponse } from '@/app/interfaces/api-response.interface.js';
import { type ConfigService } from '@/core/config/config.service.js';
import { i18nLocaleResolvers } from '@/core/i18n/i18n.module.js';

import type { NextFunction, Request, Response } from 'express';

export const API_PREFIX = 'api';
export const API_VERSION_DEFAULT = '1';

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

// Routes registered after this never answer: the 404 fallback is the last Express handler.
export const setupApp = async (app: INestApplication, configService: ConfigService): Promise<void> => {
	app.enableCors({ origin: configService.corsOrigin });
	app.setGlobalPrefix(API_PREFIX, { exclude: ['health/{*splat}'] });
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: API_VERSION_DEFAULT
	});

	await app.init();

	app.use(notFoundFallback(app));
};
