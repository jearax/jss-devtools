import { BadRequestException } from '@nestjs/common';

import { type ValidationError } from '@/app/interfaces/api-response.interface.js';

// `code` is zod's own issue field; the i18n pipe keeps it through translation.
type SchemaIssue = {
	readonly message: string;
	readonly path?: readonly unknown[] | undefined;
	readonly code?: unknown;
};

const segmentKey = (segment: unknown): string => {
	return String(typeof segment === 'object' && segment !== null && 'key' in segment ? segment.key : segment);
};

const toValidationError = (issue: SchemaIssue): ValidationError => {
	return {
		path: (issue.path ?? []).map(segmentKey).join('.'),
		code: typeof issue.code === 'string' ? issue.code : null,
		message: issue.message
	};
};

export class ValidationException extends BadRequestException {
	readonly errors: readonly ValidationError[];

	constructor(issues: readonly SchemaIssue[]) {
		super();
		this.errors = issues.map(toValidationError);
	}
}
