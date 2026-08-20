// Shared upgrade flow used by `update` (no-args) and `upgrade` (no-args / <spec>).
// Handles detection, registry fetch, spec resolution, confirm, exec/dry-run.
import { detectGlobalPM } from '@/core/global-pm-detector/index.js';
import { fetchPackageMetadata } from '@/core/registry-client/fetch-package.js';
import { execOrDryRunInstall } from '@/core/self-installer/index.js';
import { parseSpec, resolveTarget } from '@/core/version-resolver/resolve-target.js';
import { logger } from '@/utils/logger.js';
import { confirmOrThrow, isTTY } from '@/utils/prompts.js';

import type { ParsedSpec, ResolveResult } from '@/core/version-resolver/types.js';

const PKG = 'jss-devtools';

export interface UpgradeOptions {
  spec?: string;
  yes?: boolean;
  dryRun?: boolean;
  json?: boolean;
}

export interface UpgradeResult {
  schemaVersion: '1.0';
  command: 'update' | 'upgrade';
  result: 'success' | 'noop' | 'cancelled' | 'error';
  pm: string | null;
  package: string;
  spec: string | null;
  current: string;
  target: string | null;
  majorBump: boolean;
  dryRun: boolean;
  cmdStr?: string;
  message: string;
  error?: { code: string; message: string };
}

const outputJson = (result: object) => {
  console.log(JSON.stringify(result, null, 2));
};

const finalize = (
  resolved: ResolveResult,
  pmName: string,
  dryRun: boolean,
  specRaw: string | undefined,
  command: 'update' | 'upgrade',
  status: 'success' | 'noop' | 'cancelled'
): UpgradeResult => ({
  schemaVersion: '1.0',
  command,
  result: status,
  pm: pmName,
  package: PKG,
  spec: resolved.direction === 'noop' ? null : (specRaw ?? null),
  current: resolved.current,
  target: resolved.target || null,
  majorBump: resolved.majorBump,
  dryRun,
  message: resolved.message,
});

export const runUpgradeFlow = async (options: UpgradeOptions, command: 'update' | 'upgrade'): Promise<void> => {
  const dryRun = options.dryRun === true;
  const jsonMode = options.json === true;
  const yes = options.yes === true;

  const detected = await detectGlobalPM(PKG);
  if (!detected) {
    const msg = `Could not detect any package manager that installed ${PKG} globally. Install via npm/pnpm/yarn/bun.`;
    const err: UpgradeResult = {
      schemaVersion: '1.0',
      command,
      result: 'error',
      pm: null,
      package: PKG,
      spec: options.spec ?? null,
      current: '0.0.0',
      target: null,
      majorBump: false,
      dryRun: false,
      message: msg,
      error: { code: 'PM_NOT_DETECTED', message: msg },
    };
    if (jsonMode) outputJson(err);
    else logger.error(msg);
    process.exit(1);
  }

  const meta = await fetchPackageMetadata(PKG);
  const spec: ParsedSpec | undefined = options.spec ? parseSpec(options.spec) : undefined;
  const resolved = resolveTarget(spec, detected.version, meta, 'upgrade');

  if (resolved.direction === 'invalid') {
    const err: UpgradeResult = {
      schemaVersion: '1.0',
      command,
      result: 'error',
      pm: detected.pm,
      package: PKG,
      spec: options.spec ?? null,
      current: detected.version,
      target: null,
      majorBump: false,
      dryRun: false,
      message: resolved.message,
      error: { code: 'SPEC_INVALID', message: resolved.message },
    };
    if (jsonMode) outputJson(err);
    else logger.error(resolved.message);
    process.exit(1);
  }

  if (resolved.direction === 'noop') {
    const r = finalize(resolved, detected.pm, false, options.spec, command, 'noop');
    if (jsonMode) outputJson(r);
    else logger.info(resolved.message);
    process.exit(0);
  }

  if (!yes && isTTY()) {
    const bumpNote = resolved.majorBump ? '⚠️  Major version bump. Breaking changes likely.\n' : '';
    try {
      await confirmOrThrow(
        `${bumpNote}Upgrade ${PKG} from ${resolved.current} to ${resolved.target} via ${detected.pm}?\nWill run: ${detected.pm} add -g ${PKG}@${resolved.target}`
      );
    } catch (err) {
      if (String(err).includes('USER_CANCELLED')) {
        const r = finalize(resolved, detected.pm, true, options.spec, command, 'cancelled');
        if (jsonMode) outputJson(r);
        else logger.info('Cancelled by user.');
        process.exit(0);
      }
      throw err;
    }
  }

  const result = await execOrDryRunInstall(detected.pm, PKG, resolved.target, dryRun);

  const status: 'success' | 'cancelled' = dryRun ? 'cancelled' : 'success';
  const r: UpgradeResult = {
    ...finalize(resolved, detected.pm, dryRun, options.spec, command, status),
    cmdStr: result.cmdStr,
  };
  if (jsonMode) {
    outputJson(r);
  } else {
    logger.success(
      dryRun ? `[dry-run] Would upgrade ${PKG} to ${resolved.target}` : `Upgraded ${PKG} to ${resolved.target}`
    );
    if (!dryRun) logger.info('💡 Restart your shell to refresh PATH cache.');
  }
};
