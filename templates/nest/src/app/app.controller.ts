import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

@Controller('health')
export class AppController {
	constructor(private readonly healthCheckService: HealthCheckService) {}

	@Get('ready')
	@HealthCheck()
	ready(): Promise<HealthCheckResult> {
		return this.healthCheckService.check([]);
	}
}
