import { Injectable } from '@nestjs/common';

import { type Course } from '@/domains/learning/course/entities/course.entity.js';

const SEED: readonly Course[] = [
	{
		id: 'course-os',
		title: 'Operating systems, from the bottom up',
		description: 'Processes, scheduling, memory and the syscalls in between.',
		createdAt: '2026-01-05T09:00:00.000Z',
		updatedAt: '2026-01-05T09:00:00.000Z'
	},
	{
		id: 'course-nest',
		title: 'Building APIs with Nest',
		description: 'Modules, providers, the request lifecycle and a clean response envelope.',
		createdAt: '2026-01-06T09:00:00.000Z',
		updatedAt: '2026-01-06T09:00:00.000Z'
	}
];

@Injectable()
export class CourseRepository {
	private readonly courses = new Map<string, Course>();

	constructor() {
		for (const course of SEED) {
			this.courses.set(course.id, { ...course });
		}
	}

	all(): Course[] {
		return [...this.courses.values()].map((course) => {
			return { ...course };
		});
	}

	find(id: string): Course | undefined {
		const course = this.courses.get(id);

		return course === undefined ? undefined : { ...course };
	}

	save(course: Course): Course {
		const stored = { ...course };

		this.courses.set(stored.id, stored);

		return { ...stored };
	}

	remove(id: string): boolean {
		return this.courses.delete(id);
	}
}
