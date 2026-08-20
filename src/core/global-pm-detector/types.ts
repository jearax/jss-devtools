export type PM = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface DetectedPM {
  pm: PM;
  version: string; // current CLI version installed globally
}
