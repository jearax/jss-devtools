import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';

import { ResponseMessage } from '@/app/decorators/response-message.decorator.js';

import { createCourseSchema, type CreateCourseDto } from './dtos/create-course.dto.js';
import { updateCourseSchema, type UpdateCourseDto } from './dtos/update-course.dto.js';
import { type Course } from './entities/course.entity.js';
import { CourseService } from './services/course.service.js';

@Controller('courses')
export class CourseController {
	constructor(private readonly courseService: CourseService) {}

	@Get()
	list(): Course[] {
		return this.courseService.list();
	}

	@Get(':id')
	detail(@Param('id') id: string): Course {
		return this.courseService.detail(id);
	}

	@Post()
	create(@Body({ schema: createCourseSchema }) dto: CreateCourseDto): Course {
		return this.courseService.create(dto);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body({ schema: updateCourseSchema }) dto: UpdateCourseDto): Course {
		return this.courseService.update(id, dto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.OK)
	@ResponseMessage('course.deleted')
	delete(@Param('id') id: string): null {
		this.courseService.delete(id);

		return null;
	}
}
