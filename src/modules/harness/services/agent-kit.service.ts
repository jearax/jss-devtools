import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { AGENT_KIT_CONFIG } from '@/modules/harness/constants/harness-paths.constant';

export const usesAgentKit = (root: string): boolean => {
	return existsSync(join(root, AGENT_KIT_CONFIG));
};
