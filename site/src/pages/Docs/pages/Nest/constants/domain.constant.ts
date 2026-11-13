/** The paragraphs of the example-domain section, rendered through `RichText`. */
export const NEST_DOMAIN_PARAGRAPHS: readonly string[] = [
	"The preset ships one example domain, `src/domains/learning/course/`, so the generated app shows every convention in one folder: a `zod` schema travels with `@Body({ schema })`, a missing id throws `NotFoundException('course.not_found')`, and the repository keeps the courses in memory, seeded on construction. Ids come from `HelperService.uuid()`.",
	"The routes are URI-versioned from `API_VERSION_DEFAULT` in `src/app/app.setup.ts` — the same setup `main.ts` and the e2e suites run — behind the `/api` global prefix; `/health/ready` stays unprefixed. Every 404 answers the translated envelope, inside the prefix and outside it. `DELETE` answers 200 with `data: null` so the envelope survives; a v2 is opt-in per route with `@Version('2')`.",
	'Pass `--no-sample` to skip the example domain: `init` then writes an empty `src/domains/.gitkeep` and an `app.module.ts` without `CourseModule`.'
];

/** One row of the example-domain routes table. */
export type NestDomainRoute = {
	method: string;
	path: string;
	success: string;
};

/** The routes the example domain answers, read from `course.controller.ts`. */
export const NEST_DOMAIN_ROUTES: readonly NestDomainRoute[] = [
	{
		method: 'GET',
		path: '/api/v1/courses',
		success: '200 with the seeded list'
	},
	{
		method: 'GET',
		path: '/api/v1/courses/:id',
		success: '200, or 404 `course.not_found`'
	},
	{
		method: 'POST',
		path: '/api/v1/courses',
		success: '201 with the created course'
	},
	{
		method: 'PATCH',
		path: '/api/v1/courses/:id',
		success: '200, or 404 `course.not_found`; an empty body is a 400'
	},
	{
		method: 'DELETE',
		path: '/api/v1/courses/:id',
		success: '200 with `data: null`, or 404 `course.not_found`'
	}
];
