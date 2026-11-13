import path from 'node:path';

import { Module } from '@nestjs/common';
import {
	AcceptLanguageLocaleResolver,
	HeaderLocaleResolver,
	I18nModule as NestI18nModule,
	JsonI18nLoader,
	QueryLocaleResolver
} from '@nestjs/i18n';

// The one resolution chain (?lang, x-lang, Accept-Language); the prefix fallback outside Nest's
// router walks it by hand, since the i18n middleware never runs on those paths.
export const i18nLocaleResolvers = [
	new QueryLocaleResolver('lang'),
	new HeaderLocaleResolver('x-lang'),
	new AcceptLanguageLocaleResolver()
];

@Module({
	imports: [
		NestI18nModule.forRootAsync({
			loader: new JsonI18nLoader({ path: path.join(import.meta.dirname, 'locales') }),
			// Explicit choices first: every browser sends Accept-Language, which would shadow them.
			resolvers: i18nLocaleResolvers,
			useFactory: () => {
				return {
					defaultLocale: 'en'
				};
			}
		})
	]
})
export class I18nModule {}
