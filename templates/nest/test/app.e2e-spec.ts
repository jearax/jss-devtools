import { Controller, Get, Module, type INestApplication } from '@nestjs/common';
import {
	HealthCheck,
	HealthCheckService,
	HealthIndicatorService,
	TerminusModule,
	type HealthCheckResult
} from '@nestjs/terminus';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { AppModule } from '@/app/app.module.js';
import { setupApp } from '@/app/app.setup.js';
import { type ApiResponse } from '@/app/interfaces/api-response.interface.js';
import { ConfigService } from '@/core/config/config.service.js';

import type { App } from 'supertest/types.js';

@Controller('_probe')
class ProbeSpecController {
	constructor(
		private readonly healthCheckService: HealthCheckService,
		private readonly healthIndicatorService: HealthIndicatorService
	) {}

	@Get()
	@HealthCheck()
	probe(): Promise<HealthCheckResult> {
		return this.healthCheckService.check([
			() => {
				return this.healthIndicatorService.check('probe').down();
			}
		]);
	}
}

@Module({
	imports: [AppModule, TerminusModule],
	controllers: [ProbeSpecController]
})
class ProbeSpecModule {}

describe('AppController (e2e)', () => {
	let app: INestApplication<App>;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ProbeSpecModule]
		}).compile();

		app = moduleFixture.createNestApplication();
		await setupApp(app, app.get(ConfigService));
	});

	it('GET /health/ready answers 200 with the Terminus result', async () => {
		const response = await request(app.getHttpServer()).get('/health/ready').expect(200);

		expect(response.body).toEqual({
			status: 200,
			message: 'Success.',
			data: {
				status: 'ok',
				info: {},
				error: {},
				details: {}
			}
		});
	});

	it('a failing health indicator answers 503 without its details', async () => {
		const response = await request(app.getHttpServer()).get('/api/v1/_probe').set('Accept-Language', 'vi').expect(503);

		const body = response.body as ApiResponse<null>;

		expect(body.status).toBe(503);
		expect(body.message).toBe('Dịch vụ đang tạm ngưng. Vui lòng thử lại sau.');
		expect(body.data).toBeNull();
	});
});
