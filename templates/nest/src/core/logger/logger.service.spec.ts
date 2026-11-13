import { type PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';

import { LoggerService } from './logger.service.js';

const loggerWith = (context?: string): { loggerService: LoggerService; info: ReturnType<typeof vi.fn> } => {
	const info = vi.fn();
	const loggerService = new LoggerService({ info } as unknown as PinoLogger, {});

	if (context !== undefined) {
		loggerService.setContext(context);
	}

	return {
		loggerService,
		info
	};
};

describe('LoggerService', () => {
	it('tags a line with the context set for its injection site', () => {
		const { loggerService, info } = loggerWith('UsersService');

		loggerService.log('created');

		expect(info).toHaveBeenCalledWith({ context: 'UsersService' }, 'created');
	});

	it("keeps Nest's own trailing context over the default one", () => {
		const { loggerService, info } = loggerWith('Bootstrap');

		loggerService.log('Mapped {/users, GET} route', 'RouterExplorer');

		expect(info).toHaveBeenCalledWith({ context: 'RouterExplorer' }, 'Mapped {/users, GET} route');
	});

	it('logs without a context when none is set', () => {
		const { loggerService, info } = loggerWith();

		loggerService.log('plain');

		expect(info).toHaveBeenCalledWith({}, 'plain');
	});
});
