import { NestFactory } from '@nestjs/core';

import { AppModule } from '@/app/app.module.js';
import { setupApp } from '@/app/app.setup.js';
import { ConfigService } from '@/core/config/config.service.js';
import { LoggerService } from '@/core/logger/logger.service.js';

const bootstrap = async (): Promise<void> => {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	const configService = app.get(ConfigService);
	const loggerService = await app.resolve(LoggerService);

	loggerService.setContext('Bootstrap');
	app.useLogger(loggerService);
	setupApp(app, configService);
	app.enableShutdownHooks();

	await app.listen(configService.appPort);

	loggerService.log(`Listening on port ${configService.appPort} (${configService.nodeEnv})`);
};

await bootstrap();
