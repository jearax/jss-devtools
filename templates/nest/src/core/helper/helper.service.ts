import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperService {
	uuid(): string {
		return randomUUID();
	}

	nowIso(): string {
		return new Date().toISOString();
	}

	parseJsonSafe<T>(raw: string): T | undefined {
		try {
			return JSON.parse(raw) as T;
		} catch {
			return undefined;
		}
	}
}
