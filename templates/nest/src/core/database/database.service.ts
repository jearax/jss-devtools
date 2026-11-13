import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service.js';
import { LoggerService } from '@/core/logger/logger.service.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
	constructor(
		private readonly configService: ConfigService,
		private readonly loggerService: LoggerService
	) {
		this.loggerService.setContext(DatabaseService.name);
	}

	onModuleInit(): void {
		if (this.configService.databaseUrl === undefined) {
			this.loggerService.log('No DATABASE_URL is set; the database frame runs without a connection.');
			return;
		}

		this.loggerService.log('DATABASE_URL is set; connect the database driver here.');
	}

	onModuleDestroy(): void {
		this.loggerService.log('The database frame released its connection.');
	}
}
