import path from 'node:path';

import { Module } from '@nestjs/common';
import {
	AcceptLanguageLocaleResolver,
	HeaderLocaleResolver,
	I18nModule as NestI18nModule,
	JsonI18nLoader,
	QueryLocaleResolver
} from '@nestjs/i18n';

@Module({
	imports: [
		NestI18nModule.forRootAsync({
			loader: new JsonI18nLoader({ path: path.join(import.meta.dirname, 'locales') }),
			// Explicit choices first: every browser sends Accept-Language, which would shadow them.
			resolvers: [
				new QueryLocaleResolver('lang'),
				new HeaderLocaleResolver('x-lang'),
				new AcceptLanguageLocaleResolver()
			],
			useFactory: () => {
				return {
					defaultLocale: 'en'
				};
			}
		})
	]
})
export class I18nModule {}
