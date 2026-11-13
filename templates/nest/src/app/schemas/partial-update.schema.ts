import { type z } from 'zod';

export const partialUpdate = <Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) => {
	return schema.partial().refine(
		(body) => {
			return Object.keys(body).length > 0;
		},
		{
			message: 'The body carries no field.',
			path: ['body'],
			params: { key: 'empty_body' }
		}
	);
};
