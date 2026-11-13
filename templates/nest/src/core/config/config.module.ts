import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { ConfigService } from './config.service.js';
import { envSchema } from './env.schema.js';

const nodeEnv = process.env.NODE_ENV ?? 'local';

@Global()
@Module({
	imports: [
		NestConfigModule.forRoot({
			isGlobal: true,
			validationSchema: envSchema,
			envFilePath: [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, '.env.local', '.env']
		})
	],
	providers: [ConfigService],
	exports: [ConfigService]
})
export class ConfigModule {}
