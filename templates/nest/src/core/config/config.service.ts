import { Injectable } from '@nestjs/common';

import { envSchema, type Env } from './env.schema.js';

@Injectable()
export class ConfigService {
	private readonly values: Env;

	constructor() {
		this.values = envSchema.parse(process.env);
	}

	get nodeEnv(): Env['NODE_ENV'] {
		return this.values.NODE_ENV;
	}

	get corsOrigin(): string | string[] {
		const origins = this.values.APP_CORS_ORIGIN;

		return origins.length === 0 || origins.includes('*') ? '*' : origins;
	}

	get appPort(): number {
		return this.values.APP_PORT;
	}

	get logLevel(): Env['LOG_LEVEL'] {
		return this.values.LOG_LEVEL;
	}

	get logFormat(): Exclude<Env['LOG_FORMAT'], undefined> {
		return this.values.LOG_FORMAT ?? (this.isLocal ? 'pretty' : 'json');
	}

	get isLocal(): boolean {
		return this.values.NODE_ENV === 'local' || this.values.NODE_ENV === 'dev';
	}

	get databaseUrl(): string | undefined {
		return this.values.DATABASE_URL;
	}
}
