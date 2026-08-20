// Self-installer: execute PM commands for install/remove with dry-run support.
// `stdio: 'inherit'` so user sees PM's native output.
// Command arrays come from `package-manager-detector`'s resolveCommand.
import { execa } from 'execa';
import { resolveCommand } from 'package-manager-detector';

import { PM_DISPLAY_NAMES } from '@/core/detector/global-pm.js';
import { logger } from '@/utils/logger.js';

import type { DryRunResult } from '@/core/version-resolver/types.js';
import type { AgentName } from 'package-manager-detector';

export interface ExecResult {
  ok: boolean;
  dryRun: boolean;
  cmdStr: string;
  pm: AgentName;
}

const fmt = (pm: AgentName, args: string[]): string => `${PM_DISPLAY_NAMES[pm]} ${args.join(' ')}`;

export const execOrDryRunInstall = async (
  pm: AgentName,
  pkg: string,
  version: string,
  dryRun: boolean
): Promise<ExecResult> => {
  const resolved = resolveCommand(pm, 'global', [`${pkg}@${version}`]);
  if (!resolved) throw new Error(`No install command for ${pm}`);
  const cmdStr = fmt(pm, resolved.args);
  if (dryRun) {
    logger.info(`[dry-run] Would execute: ${cmdStr}`);
    return { ok: true, dryRun: true, cmdStr, pm };
  }
  logger.info(`Executing: ${cmdStr}`);
  await execa(resolved.command, resolved.args, { stdio: 'inherit' });
  return { ok: true, dryRun: false, cmdStr, pm };
};

export const execOrDryRunRemove = async (pm: AgentName, pkg: string, dryRun: boolean): Promise<ExecResult> => {
  const resolved = resolveCommand(pm, 'global_uninstall', [pkg]);
  if (!resolved) throw new Error(`No uninstall command for ${pm}`);
  const cmdStr = fmt(pm, resolved.args);
  if (dryRun) {
    logger.info(`[dry-run] Would execute: ${cmdStr}`);
    return { ok: true, dryRun: true, cmdStr, pm };
  }
  logger.info(`Executing: ${cmdStr}`);
  await execa(resolved.command, resolved.args, { stdio: 'inherit' });
  return { ok: true, dryRun: false, cmdStr, pm };
};
