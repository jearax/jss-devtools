// Shared upgrade flow: detect → fetch → resolve → confirm → exec (used by update + upgrade).
import consola from 'consola';
import semver from 'semver';

import { fetchPackageMetadata } from '@/core/registry-client/fetch-package';
import { execOrDryRunInstall } from '@/core/self-installer/exec';
import { parseSpec, resolveTarget } from '@/core/version-resolver/resolve-target';
import { logger } from '@/utils/logger';

import { confirmOrCancel, requireGlobalPM } from '@/commands/self/utils/flow';
import { printJson } from '@/commands/self/utils/output';
import { type CommandResultStatus, baseResult, printSuccess } from '@/commands/self/utils/result';

import type { DetectedPM } from '@/core/detector/types';
import type { ParsedSpec, ResolveResult } from '@/core/version-resolver/resolve-target';

const PKG = 'jss-devtools';

export interface UpgradeOptions {
  spec?: string;
  yes?: boolean;
  dryRun?: boolean;
  json?: boolean;
}

export const runUpgradeFlow = async (options: UpgradeOptions, command: 'update' | 'upgrade'): Promise<void> => {
  const dryRun = options.dryRun === true;
  const jsonMode = options.json === true;

  const detected = await requireGlobalPM(PKG, options);
  const meta = await fetchPackageMetadata(PKG);
  const spec: ParsedSpec | undefined = options.spec ? parseSpec(options.spec) : undefined;
  const resolved = resolveTarget(spec, detected.version, meta, 'upgrade');

  if (resolved.direction === 'invalid') {
    const result = {
      ...baseResult(detected.pm, PKG, false),
      command,
      result: 'error' as CommandResultStatus,
      spec: options.spec ?? null,
      current: detected.version,
      error: { code: 'SPEC_INVALID', message: resolved.message },
    };
    if (jsonMode) {
      printJson(result);
    } else {
      logger.error(resolved.message);
    }
    process.exit(1);
  }

  if (resolved.direction === 'noop') {
    const result = {
      ...baseResult(detected.pm, PKG, false),
      command,
      result: 'noop' as CommandResultStatus,
      spec: options.spec ?? null,
      current: detected.version,
      target: null,
      majorBump: resolved.majorBump,
      message: resolved.message,
    };
    if (jsonMode) {
      printJson(result);
    } else {
      logger.info(resolved.message);
    }
    process.exit(0);
  }

  const bumpNote = resolved.majorBump ? '⚠️  Major version bump. Breaking changes likely.\n' : '';
  await confirmOrCancel(
    options,
    `${bumpNote}Upgrade ${PKG} from ${resolved.current} to ${resolved.target} via ${detected.pm}?\nWill run: ${detected.pm} add -g ${PKG}@${resolved.target}`,
    {
      ...baseResult(detected.pm, PKG, true),
      command,
      result: 'cancelled' as CommandResultStatus,
      spec: options.spec ?? null,
      current: detected.version,
      target: resolved.target,
      majorBump: resolved.majorBump,
      message: 'Cancelled by user',
    }
  );

  const result = await execOrDryRunInstall(detected.pm, PKG, resolved.target, dryRun);

  if (jsonMode) {
    printJson({
      ...baseResult(detected.pm, PKG, dryRun),
      command,
      result: (dryRun ? 'cancelled' : 'success') as CommandResultStatus,
      spec: options.spec ?? null,
      current: detected.version,
      target: resolved.target,
      majorBump: resolved.majorBump,
      cmdStr: result.cmdStr,
      message: dryRun
        ? `[dry-run] Would upgrade ${PKG} to ${resolved.target}`
        : `Upgraded ${PKG} to ${resolved.target}`,
    });
  } else {
    printSuccess(`Upgrade ${PKG} to ${resolved.target}`, dryRun);
  }
};

// Re-export ResolveResult type for typecheck usage in other modules
export type { ResolveResult, DetectedPM, ParsedSpec };
// keep consola import alive (used elsewhere via flow.ts)
void consola;
