import { type z } from 'zod';

import { partialUpdate } from '@/app/schemas/partial-update.schema.js';

import { createCourseSchema } from './create-course.dto.js';

export const updateCourseSchema = partialUpdate(createCourseSchema);
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;
