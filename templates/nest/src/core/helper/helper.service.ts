import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperService {
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
