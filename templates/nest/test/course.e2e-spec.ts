import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '@/app/app.module.js';
import { setupApp } from '@/app/app.setup.js';
import { type ApiResponse, type ValidationError } from '@/app/interfaces/api-response.interface.js';
import { ConfigService } from '@/core/config/config.service.js';
import { type Course } from '@/domains/learning/course/entities/course.entity.js';

import type { App } from 'supertest/types.js';

const SEED_ID = 'course-os';

describe('CourseController (e2e)', () => {
	let app: INestApplication<App>;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule]
		}).compile();

		app = moduleFixture.createNestApplication({ logger: false });
		setupApp(app, app.get(ConfigService));
		await app.init();
	});

	it('answers /health/ready without a version prefix', async () => {
		const response = await request(app.getHttpServer()).get('/health/ready').expect(200);

		expect((response.body as ApiResponse<unknown>).message).toBe('Success.');
	});

	it('lists the seeded courses at /api/v1/courses', async () => {
		const response = await request(app.getHttpServer()).get('/api/v1/courses').expect(200);

		const body = response.body as ApiResponse<Course[]>;

		expect(body.data).toHaveLength(2);
		expect(
			body.data.every((course) => {
				return typeof course.id === 'string' && typeof course.title === 'string';
			})
		).toBe(true);
	});

	it('answers the seeded course on /api/v1/courses/:id', async () => {
		const response = await request(app.getHttpServer()).get(`/api/v1/courses/${SEED_ID}`).expect(200);

		expect((response.body as ApiResponse<Course>).data.id).toBe(SEED_ID);
	});

	it('answers course.not_found translated on an unknown id', async () => {
		const byVi = await request(app.getHttpServer()).get('/api/v1/courses/missing?lang=vi').expect(404);
		const byEn = await request(app.getHttpServer()).get('/api/v1/courses/missing?lang=en').expect(404);

		expect((byVi.body as ApiResponse<null>).message).toBe('Không tìm thấy khóa học.');
		expect((byEn.body as ApiResponse<null>).message).toBe('The course was not found.');
		expect((byVi.body as ApiResponse<null>).data).toBeNull();
	});

	it('creates a course from a valid body', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/v1/courses')
			.send({
				title: 'Distributed systems',
				description: 'Consensus and replication'
			})
			.expect(201);

		const created = (response.body as ApiResponse<Course>).data;

		expect(created.title).toBe('Distributed systems');
		expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
		expect(created.createdAt).toBe(created.updatedAt);
	});

	it('validates a missing title, translated', async () => {
		const byVi = await request(app.getHttpServer()).post('/api/v1/courses?lang=vi').send({}).expect(400);
		const byEn = await request(app.getHttpServer()).post('/api/v1/courses?lang=en').send({}).expect(400);

		const viBody = byVi.body as ApiResponse<ValidationError[]>;
		const enBody = byEn.body as ApiResponse<ValidationError[]>;

		expect(viBody.message).toBe('Yêu cầu không hợp lệ.');
		expect(enBody.message).toBe('The request is invalid.');
		expect(viBody.data?.[0]).toMatchObject({
			path: 'title',
			code: 'invalid_type'
		});
		expect(viBody.data?.[0]?.message).toContain('bắt buộc');
		expect(enBody.data?.[0]?.message).toContain('required');
	});

	it('validates a wrong-typed title, translated', async () => {
		const byVi = await request(app.getHttpServer()).post('/api/v1/courses?lang=vi').send({ title: 42 }).expect(400);

		const body = byVi.body as ApiResponse<ValidationError[]>;

		expect(body.data?.[0]).toMatchObject({
			path: 'title',
			code: 'invalid_type'
		});
		expect(body.data?.[0]?.message).toContain('đúng kiểu dữ liệu');
	});

	it('validates a too-short title, translated', async () => {
		const byVi = await request(app.getHttpServer()).post('/api/v1/courses?lang=vi').send({ title: 'ab' }).expect(400);
		const byEn = await request(app.getHttpServer()).post('/api/v1/courses?lang=en').send({ title: 'ab' }).expect(400);

		expect((byVi.body as ApiResponse<ValidationError[]>).data?.[0]?.message).toContain('ít nhất 3 ký tự');
		expect((byEn.body as ApiResponse<ValidationError[]>).data?.[0]?.message).toContain('at least 3 characters');
	});

	it('rejects an empty PATCH body, translated', async () => {
		const byVi = await request(app.getHttpServer()).patch(`/api/v1/courses/${SEED_ID}?lang=vi`).send({}).expect(400);
		const byEn = await request(app.getHttpServer()).patch(`/api/v1/courses/${SEED_ID}?lang=en`).send({}).expect(400);

		expect((byVi.body as ApiResponse<ValidationError[]>).data?.[0]?.message).toBe(
			'Cần gửi ít nhất một trường để cập nhật.'
		);
		expect((byEn.body as ApiResponse<ValidationError[]>).data?.[0]?.message).toBe('Send at least one field to update.');
	});

	it('patches one field onto the seeded course', async () => {
		const response = await request(app.getHttpServer())
			.patch(`/api/v1/courses/${SEED_ID}`)
			.send({ description: 'Syscalls, scheduling and memory' })
			.expect(200);

		const updated = (response.body as ApiResponse<Course>).data;

		expect(updated.title).toBe('Operating systems, from the bottom up');
		expect(updated.description).toBe('Syscalls, scheduling and memory');
		expect(updated.updatedAt > updated.createdAt).toBe(true);
	});

	it('answers course.not_found when patching a missing id', async () => {
		const response = await request(app.getHttpServer())
			.patch('/api/v1/courses/missing')
			.send({ title: 'A valid title' })
			.expect(404);

		expect((response.body as ApiResponse<null>).data).toBeNull();
	});

	it('deletes with 200 and a null payload, then the id is gone', async () => {
		const response = await request(app.getHttpServer()).delete(`/api/v1/courses/${SEED_ID}?lang=vi`).expect(200);

		const body = response.body as ApiResponse<null>;

		expect(body.message).toBe('Đã xóa khóa học.');
		expect(body.data).toBeNull();

		await request(app.getHttpServer()).get(`/api/v1/courses/${SEED_ID}`).expect(404);
	});
});
