import { Module } from '@nestjs/common';

import { CourseController } from './course.controller.js';
import { CourseRepository } from './repositories/course.repository.js';
import { CourseService } from './services/course.service.js';

@Module({
	controllers: [CourseController],
	providers: [CourseService, CourseRepository]
})
export class CourseModule {}
