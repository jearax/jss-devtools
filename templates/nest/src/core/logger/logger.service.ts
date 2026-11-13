import { Inject, Injectable, Scope } from '@nestjs/common';
import { Logger, PARAMS_PROVIDER_TOKEN, PinoLogger, type Params } from 'nestjs-pino';

/** Transient: each injecting class calls `setContext(Class.name)` for its own context. */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends Logger {
	private context: string | undefined;

	constructor(pinoLogger: PinoLogger, @Inject(PARAMS_PROVIDER_TOKEN) params: Params) {
		super(pinoLogger, params);
	}

	setContext(context: string): void {
		this.context = context;
	}

	override verbose(message: unknown, ...optionalParams: unknown[]): void {
		super.verbose(message, ...this.withContext(optionalParams));
	}

	override debug(message: unknown, ...optionalParams: unknown[]): void {
		super.debug(message, ...this.withContext(optionalParams));
	}

	override log(message: unknown, ...optionalParams: unknown[]): void {
		super.log(message, ...this.withContext(optionalParams));
	}

	override warn(message: unknown, ...optionalParams: unknown[]): void {
		super.warn(message, ...this.withContext(optionalParams));
	}

	override error(message: unknown, ...optionalParams: unknown[]): void {
		super.error(message, ...this.withContext(optionalParams));
	}

	override fatal(message: unknown, ...optionalParams: unknown[]): void {
		super.fatal(message, ...this.withContext(optionalParams));
	}

	// Nest passes the context as the last argument; a call without one gets this instance's.
	private withContext(optionalParams: unknown[]): unknown[] {
		if (optionalParams.length > 0 || this.context === undefined) {
			return optionalParams;
		}

		return [this.context];
	}
}
