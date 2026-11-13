import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule, type Params } from 'nestjs-pino';

import { ConfigService } from '@/core/config/config.service.js';

import { loggerOptions } from './logger.options.js';
import { LoggerService } from './logger.service.js';

@Global()
@Module({
	imports: [
		PinoLoggerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService): Params => {
				return loggerOptions(configService);
			}
		})
	],
	providers: [LoggerService],
	exports: [PinoLoggerModule, LoggerService]
})
export class LoggerModule {}
