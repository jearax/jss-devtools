import { describe, expect, it } from 'vitest';

import { HelperService } from './helper.service.js';

describe('HelperService', () => {
	const helperService = new HelperService();

	it('issues a fresh UUID every call', () => {
		const first = helperService.uuid();

		expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		expect(helperService.uuid()).not.toBe(first);
	});
});
