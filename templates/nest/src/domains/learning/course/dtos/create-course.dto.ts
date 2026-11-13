import { z } from 'zod';

export const createCourseSchema = z.object({
	title: z.string().min(3),
	description: z.string().optional()
});

export type CreateCourseDto = z.infer<typeof createCourseSchema>;
