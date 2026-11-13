import { Body, Controller, Get, Module, Post, type INestApplication } from '@nestjs/common';
import {
	HealthCheck,
	HealthCheckService,
	HealthIndicatorService,
	TerminusModule,
	type HealthCheckResult
} from '@nestjs/terminus';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { z } from 'zod';

import { AppModule } from '@/app/app.module.js';
import { type ApiResponse, type ValidationError } from '@/app/interfaces/api-response.interface.js';

import type { App } from 'supertest/types.js';

const sampleSchema = z.object({
	name: z.string().min(2),
	email: z.email(),
	age: z.coerce.number().int().min(18).max(120)
});

type SampleBody = z.infer<typeof sampleSchema>;

@Controller('_sample')
class SampleSpecController {
	@Post()
	create(@Body({ schema: sampleSchema }) body: SampleBody): SampleBody {
		return body;
	}
}

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
	controllers: [SampleSpecController, ProbeSpecController]
})
class SampleSpecModule {}

describe('AppController (e2e)', () => {
	let app: INestApplication<App>;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [SampleSpecModule]
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		await app.close();
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
		const response = await request(app.getHttpServer()).get('/_probe').set('Accept-Language', 'vi').expect(503);

		const body = response.body as ApiResponse<null>;

		expect(body.status).toBe(503);
		expect(body.message).toBe('Dịch vụ đang tạm ngưng. Vui lòng thử lại sau.');
		expect(body.data).toBeNull();
	});

	it('POST /_sample answers 201 on a valid body', async () => {
		const response = await request(app.getHttpServer())
			.post('/_sample')
			.send({
				name: 'jss',
				email: 'dev@example.com',
				age: 30
			})
			.expect(201);

		expect(response.body).toEqual({
			status: 201,
			message: 'Created.',
			data: {
				name: 'jss',
				email: 'dev@example.com',
				age: 30
			}
		});
	});

	it('a missing field reads as required, translated to the request language', async () => {
		const response = await request(app.getHttpServer())
			.post('/_sample')
			.set('Accept-Language', 'vi')
			.send({
				email: 'dev@example.com',
				age: 30
			})
			.expect(400);

		const body = response.body as ApiResponse<ValidationError[]>;

		expect(body.status).toBe(400);
		expect(body.message).toBe('Yêu cầu không hợp lệ.');
		expect(body.data).toEqual([
			{
				path: 'name',
				code: 'invalid_type',
				message: expect.stringContaining('bắt buộc') as unknown
			}
		]);
	});

	it('the same request reads English under Accept-Language: en', async () => {
		const response = await request(app.getHttpServer())
			.post('/_sample')
			.set('Accept-Language', 'en')
			.send({
				email: 'dev@example.com',
				age: 30
			})
			.expect(400);

		expect(JSON.stringify(response.body)).toContain('required');
	});

	it('a bad email format names the format, not the input', async () => {
		const response = await request(app.getHttpServer())
			.post('/_sample')
			.set('Accept-Language', 'vi')
			.send({
				name: 'jss',
				email: 'not-an-email',
				age: 30
			})
			.expect(400);

		expect(JSON.stringify(response.body)).toContain('email hợp lệ');
	});

	it('a too-small string carries the minimum count', async () => {
		const response = await request(app.getHttpServer())
			.post('/_sample')
			.set('Accept-Language', 'vi')
			.send({
				name: 'j',
				email: 'dev@example.com',
				age: 30
			})
			.expect(400);

		expect(JSON.stringify(response.body)).toContain('ít nhất 2 ký tự');
	});

	it('an out-of-range number carries the boundary', async () => {
		const response = await request(app.getHttpServer())
			.post('/_sample')
			.set('Accept-Language', 'vi')
			.send({
				name: 'jss',
				email: 'dev@example.com',
				age: 12
			})
			.expect(400);

		expect(JSON.stringify(response.body)).toContain('phải từ 18');
	});
});
