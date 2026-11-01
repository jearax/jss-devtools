import { readConfig } from '@/modules/harness/services/config.service';

export const run = (root: string): unknown => {
	return readConfig(root);
};
