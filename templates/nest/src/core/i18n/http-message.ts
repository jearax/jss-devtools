import { HttpStatus } from '@nestjs/common';
import { type I18nService } from '@nestjs/i18n';

const SERVER_ERROR: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
const CLIENT_ERROR: HttpStatus = HttpStatus.BAD_REQUEST;

const genericStatus = (status: HttpStatus): HttpStatus => {
	if (status >= SERVER_ERROR) {
		return SERVER_ERROR;
	}

	return status >= CLIENT_ERROR ? CLIENT_ERROR : HttpStatus.OK;
};

export const httpMessage = (i18nService: I18nService, status: HttpStatus): string => {
	const key = `http.${status}`;

	return i18nService.translate(i18nService.exists(key) ? key : `http.${genericStatus(status)}`);
};
