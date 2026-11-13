import { Readable } from 'node:stream';

import { Controller, Get, Module, NotFoundException, StreamableFile, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '@/app/app.module.js';
import { setupApp } from '@/app/app.setup.js';
import { ResponseMessage } from '@/app/decorators/response-message.decorator.js';
import { type ApiResponse } from '@/app/interfaces/api-response.interface.js';
import { ConfigService } from '@/core/config/config.service.js';

import type { App } from 'supertest/types.js';

@Controller('_response')
class ResponseSpecController {
	@Get('missing-default')
	missingDefault(): never {
		throw new NotFoundException();
	}

	@Get('missing-key')
	missingKey(): never {
		throw new NotFoundException('http.403');
	}

	@Get('missing-text')
	missingText(): never {
		throw new NotFoundException('row 42 not in table users');
	}

	@Get('crash')
	crash(): never {
		throw new Error('database password leaked in this message');
	}

	@Get('file')
	file(): StreamableFile {
		return new StreamableFile(Readable.from(['raw bytes']), { type: 'text/plain' });
	}

	@Get('custom-message')
	@ResponseMessage('http.202')
	customMessage(): { id: number } {
		return { id: 1 };
	}
}

@Module({
	imports: [AppModule],
	controllers: [ResponseSpecController]
})
class ResponseSpecModule {}

describe('Response envelope (e2e)', () => {
	let app: INestApplication<App>;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ResponseSpecModule]
		}).compile();

		app = moduleFixture.createNestApplication({ logger: false });
		await setupApp(app, app.get(ConfigService));
	});

	afterEach(async () => {
		await app.close();
	});

	it('an exception built without a message reads the translated status line', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/v1/_response/missing-default')
			.set('Accept-Language', 'vi')
			.expect(404);

		expect(response.body).toEqual({
			status: 404,
			message: 'Không tìm thấy tài nguyên.',
			data: null
		});
	});

	it('an exception message that is a catalog key reads translated', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/v1/_response/missing-key')
			.set('Accept-Language', 'vi')
			.expect(404);

		expect(response.body).toEqual({
			status: 404,
			message: 'Bạn không có quyền thực hiện thao tác này.',
			data: null
		});
	});

	it('an exception message that is no catalog key is not shown', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/v1/_response/missing-text')
			.set('Accept-Language', 'vi')
			.expect(404);

		expect(response.body).toEqual({
			status: 404,
			message: 'Không tìm thấy tài nguyên.',
			data: null
		});
	});

	// Express parses the body before the i18n middleware runs, so this one reads the default locale.
	it('a malformed JSON body answers the envelope in the default locale, not the parser text', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/_nowhere')
			.set('Content-Type', 'application/json')
			.set('Accept-Language', 'vi')
			.send('{"name":')
			.expect(400);

		expect(response.body).toEqual({
			status: 400,
			message: 'The request is invalid.',
			data: null
		});
	});

	it('an unknown route answers the same envelope', async () => {
		const response = await request(app.getHttpServer()).get('/_nowhere').set('Accept-Language', 'vi').expect(404);

		expect(response.body).toEqual({
			status: 404,
			message: 'Không tìm thấy tài nguyên.',
			data: null
		});
	});

	// Outside the /api prefix Express matches no route; the fallback in setupApp owns it.
	it('a path outside the prefix answers the translated envelope in both locales', async () => {
		const byVi = await request(app.getHttpServer()).get('/_nowhere?lang=vi').expect(404);
		const byEn = await request(app.getHttpServer()).get('/_nowhere?lang=en').expect(404);

		expect(byVi.headers['content-type']).toContain('application/json');
		expect(byEn.headers['content-type']).toContain('application/json');
		expect((byVi.body as ApiResponse<null>).message).toBe('Không tìm thấy tài nguyên.');
		expect((byEn.body as ApiResponse<null>).message).toBe('The resource was not found.');
		expect((byEn.body as ApiResponse<null>).data).toBeNull();
	});

	it('the unversioned course path answers the envelope as well', async () => {
		const response = await request(app.getHttpServer()).get('/v1/courses?lang=en').expect(404);

		expect(response.headers['content-type']).toContain('application/json');
		expect(response.body).toEqual({
			status: 404,
			message: 'The resource was not found.',
			data: null
		});
	});

	it('an unexpected error answers 500 and names nothing internal', async () => {
		const response = await request(app.getHttpServer()).get('/api/v1/_response/crash').expect(500);

		expect(response.body).toEqual({
			status: 500,
			message: 'Something went wrong. Please try again later.',
			data: null
		});
		expect(JSON.stringify(response.body)).not.toContain('password');
	});

	it('a file passes through unwrapped', async () => {
		const response = await request(app.getHttpServer()).get('/api/v1/_response/file').expect(200);

		expect(response.text).toBe('raw bytes');
	});

	it('@ResponseMessage replaces the status line', async () => {
		const response = await request(app.getHttpServer()).get('/api/v1/_response/custom-message').expect(200);

		expect(response.body).toEqual({
			status: 200,
			message: 'Accepted.',
			data: { id: 1 }
		});
	});

	it('?lang wins over x-lang, and x-lang over Accept-Language', async () => {
		const server = app.getHttpServer();

		const byQuery = await request(server).get('/_nowhere?lang=vi').set('x-lang', 'en').set('Accept-Language', 'en');
		const byHeader = await request(server).get('/_nowhere').set('x-lang', 'vi').set('Accept-Language', 'en');
		const byBrowser = await request(server).get('/_nowhere').set('Accept-Language', 'vi-VN,vi;q=0.9');
		const byDefault = await request(server).get('/_nowhere');

		expect((byQuery.body as { message: string }).message).toBe('Không tìm thấy tài nguyên.');
		expect((byHeader.body as { message: string }).message).toBe('Không tìm thấy tài nguyên.');
		expect((byBrowser.body as { message: string }).message).toBe('Không tìm thấy tài nguyên.');
		expect((byDefault.body as { message: string }).message).toBe('The resource was not found.');
	});
});
