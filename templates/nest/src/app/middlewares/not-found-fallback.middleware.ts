import { HttpStatus, type INestApplication } from '@nestjs/common';
import { I18nService } from '@nestjs/i18n';

import { type ApiResponse } from '@/app/interfaces/api-response.interface.js';
import { i18nLocaleResolvers } from '@/core/i18n/i18n.module.js';

import type { NextFunction, Request, RequestHandler, Response } from 'express';

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

// Mount after app.init(): as the last Express handler it answers only paths no route matched.
export const notFoundFallbackMiddleware = (app: INestApplication): RequestHandler => {
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
