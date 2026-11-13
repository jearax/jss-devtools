import {
	Injectable,
	StreamableFile,
	type CallHandler,
	type ExecutionContext,
	type NestInterceptor
} from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import { I18nService } from '@nestjs/i18n';
import { map, type Observable } from 'rxjs';

import { RESPONSE_MESSAGE_KEY } from '@/app/decorators/response-message.decorator.js';
import { type ApiResponse } from '@/app/interfaces/api-response.interface.js';
import { httpMessage } from '@/core/i18n/http-message.js';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	constructor(
		private readonly reflector: Reflector,
		private readonly i18nService: I18nService
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (context.getType() !== 'http' || this.reflector.get<boolean>(SSE_METADATA, context.getHandler())) {
			return next.handle();
		}

		const response = context.switchToHttp().getResponse<{ statusCode: number }>();

		const messageKey = this.reflector.getAllAndOverride<string | undefined>(RESPONSE_MESSAGE_KEY, [
			context.getHandler(),
			context.getClass()
		]);

		return next.handle().pipe(
			map((data: unknown): unknown => {
				if (data instanceof StreamableFile) {
					return data;
				}

				const body: ApiResponse<unknown> = {
					status: response.statusCode,
					message:
						messageKey === undefined
							? httpMessage(this.i18nService, response.statusCode)
							: this.i18nService.translate(messageKey),
					data: data ?? null
				};

				return body;
			})
		);
	}
}
