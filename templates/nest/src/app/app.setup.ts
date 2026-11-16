import { VersioningType, type INestApplication } from '@nestjs/common';

import { notFoundFallbackMiddleware } from '@/app/middlewares/not-found-fallback.middleware.js';
import { type ConfigService } from '@/core/config/config.service.js';

export const API_PREFIX = 'api';
export const API_VERSION_DEFAULT = '1';

// Routes registered after this never answer: the 404 fallback is the last Express handler.
export const setupApp = async (app: INestApplication, configService: ConfigService): Promise<void> => {
	app.enableCors({ origin: configService.corsOrigin });
	app.setGlobalPrefix(API_PREFIX, { exclude: ['health/{*splat}'] });
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: API_VERSION_DEFAULT
	});

	await app.init();

	app.use(notFoundFallbackMiddleware(app));
};
