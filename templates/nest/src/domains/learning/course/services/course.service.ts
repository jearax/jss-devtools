import { Injectable, NotFoundException } from '@nestjs/common';

import { HelperService } from '@/core/helper/helper.service.js';
import { type CreateCourseDto } from '@/domains/learning/course/dtos/create-course.dto.js';
import { type UpdateCourseDto } from '@/domains/learning/course/dtos/update-course.dto.js';
import { type Course } from '@/domains/learning/course/entities/course.entity.js';
import { CourseRepository } from '@/domains/learning/course/repositories/course.repository.js';

@Injectable()
export class CourseService {
	constructor(
		private readonly courseRepository: CourseRepository,
		private readonly helperService: HelperService
	) {}

	list(): Course[] {
		return this.courseRepository.all();
	}

	detail(id: string): Course {
		const course = this.courseRepository.find(id);

		if (course === undefined) {
			throw new NotFoundException('course.not_found');
		}

		return course;
	}

	create(dto: CreateCourseDto): Course {
		const now = this.helperService.nowIso();

		return this.courseRepository.save({
			id: this.helperService.uuid(),
			title: dto.title,
			description: dto.description ?? '',
			createdAt: now,
			updatedAt: now
		});
	}

	update(id: string, dto: UpdateCourseDto): Course {
		const current = this.detail(id);

		return this.courseRepository.save({
			...current,
			title: dto.title ?? current.title,
			description: dto.description ?? current.description,
			updatedAt: this.helperService.nowIso()
		});
	}

	delete(id: string): void {
		this.detail(id);
		this.courseRepository.remove(id);
	}
}
