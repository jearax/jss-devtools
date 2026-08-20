// Self-installer: execute PM commands for install/remove with dry-run support.
// `stdio: 'inherit'` so user sees PM's native output.
import { execa } from 'execa';

import { logger } from '@/utils/logger.js';
import { PM_DISPLAY_NAMES, buildRemoveCommand, buildUpgradeCommand } from '@/utils/pm-commands.js';

import type { PM } from '@/core/global-pm-detector/types.js';
import type { DryRunResult } from '@/core/version-resolver/types.js';

export interface ExecResult {
  ok: boolean;
  dryRun: boolean;
  cmdStr: string;
  pm: PM;
}

const fmt = (pm: PM, args: string[]) => `${PM_DISPLAY_NAMES[pm]} ${args.join(' ')}`;

export const execOrDryRunInstall = async (
  pm: PM,
  pkg: string,
  version: string,
  dryRun: boolean
): Promise<ExecResult> => {
  const args = buildUpgradeCommand(pm, pkg, version);
  const cmdStr = fmt(pm, args);
  if (dryRun) {
    logger.info(`[dry-run] Would execute: ${cmdStr}`);
    return { ok: true, dryRun: true, cmdStr, pm };
  }
  logger.info(`Executing: ${cmdStr}`);
  await execa(pm, args, { stdio: 'inherit' });
  return { ok: true, dryRun: false, cmdStr, pm };
};

export const execOrDryRunRemove = async (pm: PM, pkg: string, dryRun: boolean): Promise<ExecResult> => {
  const args = buildRemoveCommand(pm, pkg);
  const cmdStr = fmt(pm, args);
  if (dryRun) {
    logger.info(`[dry-run] Would execute: ${cmdStr}`);
    return { ok: true, dryRun: true, cmdStr, pm };
  }
  logger.info(`Executing: ${cmdStr}`);
  await execa(pm, args, { stdio: 'inherit' });
  return { ok: true, dryRun: false, cmdStr, pm };
};
