import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HelperService } from '@/core/helper/helper.service.js';
import { type Course } from '@/domains/learning/course/entities/course.entity.js';
import { type CourseRepository } from '@/domains/learning/course/repositories/course.repository.js';

import { CourseService } from './course.service.js';

const helperService = {
	uuid: vi.fn(() => {
		return 'generated-id';
	}),
	nowIso: vi.fn(() => {
		return 'fixed-time';
	})
};

const courseRepository = {
	all: vi.fn<() => Course[]>(),
	find: vi.fn<(id: string) => Course | undefined>(),
	save: vi.fn<(course: Course) => Course>(),
	remove: vi.fn<(id: string) => boolean>()
};

describe('CourseService', () => {
	let courseService: CourseService;

	beforeEach(() => {
		vi.clearAllMocks();

		courseService = new CourseService(
			courseRepository as unknown as CourseRepository,
			helperService as unknown as HelperService
		);
	});

	it('lists everything the repository holds', () => {
		const courses = [{ id: 'c1' } as Course];

		courseRepository.all.mockReturnValue(courses);

		expect(courseService.list()).toBe(courses);
	});

	it('answers the seeded course on a known id', () => {
		const course = { id: 'c1' } as Course;

		courseRepository.find.mockReturnValue(course);

		expect(courseService.detail('c1')).toBe(course);
	});

	it('throws course.not_found on an unknown id', () => {
		courseRepository.find.mockReturnValue(undefined);

		expect(() => {
			return courseService.detail('missing');
		}).toThrow(NotFoundException);
		expect(() => {
			return courseService.detail('missing');
		}).toThrow('course.not_found');
	});

	it('creates with a fresh id and both timestamps', () => {
		courseRepository.save.mockImplementation((course) => {
			return course;
		});

		const created = courseService.create({
			title: 'New course',
			description: 'About the course'
		});

		expect(created.id).toBe('generated-id');
		expect(created.createdAt).toBe(created.updatedAt);
		expect(helperService.uuid).toHaveBeenCalledOnce();
	});

	it('merges an update into the current course', () => {
		courseRepository.find.mockReturnValue({
			id: 'c1',
			title: 'Old',
			description: '',
			createdAt: 't0',
			updatedAt: 't0'
		});
		courseRepository.save.mockImplementation((course) => {
			return course;
		});

		const updated = courseService.update('c1', { title: 'New' });

		expect(updated.title).toBe('New');
		expect(updated.createdAt).toBe('t0');
		expect(updated.updatedAt).not.toBe('t0');
	});

	it('removes an existing course and answers course.not_found on a missing one', () => {
		courseRepository.find.mockReturnValue({ id: 'c1' } as Course);
		courseRepository.remove.mockReturnValue(true);

		courseService.delete('c1');

		expect(courseRepository.remove).toHaveBeenCalledWith('c1');

		courseRepository.find.mockReturnValue(undefined);

		expect(() => {
			return courseService.delete('missing');
		}).toThrow(NotFoundException);
	});
});
