// Common result shape for self commands + builder helpers.
import consola from 'consola';

import type { AgentName } from 'package-manager-detector';

export type CommandResultStatus = 'success' | 'noop' | 'cancelled' | 'error';

export interface BaseResult {
  schemaVersion: '1.0';
  pm: AgentName | null;
  package: string;
  dryRun: boolean;
  message: string;
}

export const baseResult = (pm: AgentName | null, pkg: string, dryRun: boolean): BaseResult => ({
  schemaVersion: '1.0',
  pm,
  package: pkg,
  dryRun,
  message: '',
});

export const printSuccess = (msg: string, dryRun: boolean): void => {
  consola.success(dryRun ? `[dry-run] ${msg}` : msg);
  if (!dryRun) consola.info('💡 Restart your shell to refresh PATH cache.');
};
