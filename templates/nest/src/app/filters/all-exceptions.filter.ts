import { Catch, HttpException, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nService } from '@nestjs/i18n';

import { ValidationException } from '@/app/exceptions/validation.exception.js';
import { type ApiResponse } from '@/app/interfaces/api-response.interface.js';
import { httpMessage } from '@/core/i18n/http-message.js';

const SERVER_ERROR: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

type ErrorReply = Pick<ApiResponse<unknown>, 'message' | 'data'>;

// An HttpException message is an i18n key; other text (Nest's `Cannot GET /x`, parser errors) reads `http.<status>`.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	constructor(
		private readonly httpAdapterHost: HttpAdapterHost,
		private readonly i18nService: I18nService
	) {}

	catch(exception: unknown, host: ArgumentsHost): void {
		const { httpAdapter } = this.httpAdapterHost;
		const response = host.switchToHttp().getResponse<{ err?: unknown }>();

		if (httpAdapter.isHeadersSent(response)) {
			return;
		}

		const status: HttpStatus = exception instanceof HttpException ? exception.getStatus() : SERVER_ERROR;

		// pino-http logs `res.err` with its stack on the request's own line.
		if (status >= SERVER_ERROR) {
			response.err = exception;
		}

		const body: ApiResponse<unknown> = {
			status,
			...this.reply(exception, status)
		};

		httpAdapter.reply(response, body, status);
	}

	private reply(exception: unknown, status: HttpStatus): ErrorReply {
		if (exception instanceof ValidationException) {
			return {
				message: httpMessage(this.i18nService, status),
				data: exception.errors
			};
		}

		const key = exception instanceof HttpException ? exception.message : '';

		return {
			message: this.i18nService.exists(key) ? this.i18nService.translate(key) : httpMessage(this.i18nService, status),
			data: null
		};
	}
}
