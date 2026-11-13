import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { I18nStandardSchemaValidationPipe } from '@nestjs/i18n';
import { TerminusModule } from '@nestjs/terminus';

import { ValidationException } from '@/app/exceptions/validation.exception.js';
import { AllExceptionsFilter } from '@/app/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from '@/app/interceptors/response.interceptor.js';
import { ConfigModule } from '@/core/config/config.module.js';
import { DatabaseModule } from '@/core/database/database.module.js';
import { HelperModule } from '@/core/helper/helper.module.js';
import { I18nModule } from '@/core/i18n/i18n.module.js';
import { validationIssueKeys } from '@/core/i18n/issue-keys.js';
import { LoggerModule } from '@/core/logger/logger.module.js';
import { CourseModule } from '@/domains/learning/course/course.module.js';

import { AppController } from './app.controller.js';

@Module({
	imports: [ConfigModule, LoggerModule, I18nModule, DatabaseModule, HelperModule, TerminusModule, CourseModule],
	controllers: [AppController],
	providers: [
		{
			provide: APP_PIPE,
			useValue: new I18nStandardSchemaValidationPipe({
				issueKeys: validationIssueKeys,
				exceptionFactory: (issues) => {
					return new ValidationException(issues);
				}
			})
		},

		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseInterceptor
		},

		// Nest runs filters last-registered first: add type-specific filters after this catch-all.
		{
			provide: APP_FILTER,
			useClass: AllExceptionsFilter
		}
	]
})
export class AppModule {}
