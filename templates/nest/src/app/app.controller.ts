import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

@Controller({
	path: 'health',
	version: VERSION_NEUTRAL
})
export class AppController {
	constructor(private readonly healthCheckService: HealthCheckService) {}

	@Get('ready')
	@HealthCheck()
	ready(): Promise<HealthCheckResult> {
		return this.healthCheckService.check([]);
	}
}
