// Re-export AgentName from package-manager-detector as our PM type.
// Source of truth: https://github.com/antfu-collective/package-manager-detector
export type { AgentName as PM } from 'package-manager-detector';

import type { AgentName } from 'package-manager-detector';

export interface DetectedPM {
  pm: AgentName;
  version: string; // current CLI version installed globally
}
