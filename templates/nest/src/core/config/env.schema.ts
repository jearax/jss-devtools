import { z } from 'zod';

export const envSchema = z.object({
	// Environment
	NODE_ENV: z.enum(['local', 'dev', 'test', 'prod']).default('local'),

	// Application
	APP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	APP_CORS_ORIGIN: z
		.string()
		.default('*')
		.transform((value) => {
			return value
				.split(',')
				.map((origin) => {
					return origin.trim();
				})
				.filter(Boolean);
		}),

	// Logging
	LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
	LOG_FORMAT: z.enum(['json', 'pretty']).optional(),

	// Database
	DATABASE_URL: z.string().optional()
});

export type Env = z.infer<typeof envSchema>;
