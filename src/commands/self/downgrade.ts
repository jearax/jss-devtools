// `jss-devtools downgrade`:
//   - no args: auto-pick previous stable version
//   - `<spec>`: validate spec, install matching version (must be < current)
import { defineCommand } from 'citty';

import { detectGlobalPM } from '@/core/global-pm-detector/index.js';
import { fetchPackageMetadata } from '@/core/registry-client/fetch-package.js';
import { execOrDryRunInstall } from '@/core/self-installer/index.js';
import { parseSpec, resolveTarget } from '@/core/version-resolver/resolve-target.js';
import { logger } from '@/utils/logger.js';
import { confirmOrThrow, isTTY } from '@/utils/prompts.js';

import type { ParsedSpec, ResolveResult } from '@/core/version-resolver/types.js';

const PKG = 'jss-devtools';

const outputJson = (result: object) => {
  console.log(JSON.stringify(result, null, 2));
};

const finalize = (
  resolved: ResolveResult,
  pmName: string,
  dryRun: boolean,
  status: 'success' | 'noop' | 'cancelled'
) => ({
  schemaVersion: '1.0' as const,
  command: 'downgrade' as const,
  result: status,
  pm: pmName,
  package: PKG,
  spec: null,
  current: resolved.current,
  target: resolved.target || null,
  majorBump: resolved.majorBump,
  dryRun,
  message: resolved.message,
});

export const downgradeCommand = defineCommand({
  meta: {
    name: 'downgrade',
    description: 'Downgrade CLI to previous or specified version',
  },
  args: {
    spec: {
      type: 'string',
      description: 'Version spec (tag, exact, or semver range)',
      required: false,
    },
    yes: {
      type: 'boolean',
      description: 'Skip confirmation prompt',
      default: false,
    },
    'dry-run': {
      type: 'boolean',
      description: 'Print command without executing',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Output structured JSON',
      default: false,
    },
  },
  async run({ args }) {
    const dryRun = args['dry-run'] === true;
    const jsonMode = args.json === true;
    const yes = args.yes === true;

    const detected = await detectGlobalPM(PKG);
    if (!detected) {
      const msg = `Could not detect any package manager that installed ${PKG} globally.`;
      const err = {
        schemaVersion: '1.0',
        command: 'downgrade',
        result: 'error',
        error: { code: 'PM_NOT_DETECTED', message: msg },
      };
      if (jsonMode) outputJson(err);
      else logger.error(msg);
      process.exit(1);
    }

    const meta = await fetchPackageMetadata(PKG);
    const spec: ParsedSpec | undefined = typeof args.spec === 'string' ? parseSpec(args.spec) : undefined;
    const resolved = resolveTarget(spec, detected.version, meta, 'downgrade');

    if (resolved.direction === 'invalid') {
      const err = {
        schemaVersion: '1.0',
        command: 'downgrade',
        result: 'error',
        pm: detected.pm,
        package: PKG,
        spec: args.spec ?? null,
        current: detected.version,
        error: { code: 'SPEC_INVALID', message: resolved.message },
      };
      if (jsonMode) outputJson(err);
      else logger.error(resolved.message);
      process.exit(1);
    }

    if (resolved.direction === 'noop') {
      const r = finalize(resolved, detected.pm, false, 'noop');
      if (jsonMode) outputJson(r);
      else logger.info(resolved.message);
      process.exit(0);
    }

    if (!yes && isTTY()) {
      try {
        await confirmOrThrow(
          `Downgrade ${PKG} from ${resolved.current} to ${resolved.target} via ${detected.pm}?\nWill run: ${detected.pm} add -g ${PKG}@${resolved.target}`
        );
      } catch (err) {
        if (String(err).includes('USER_CANCELLED')) {
          const r = { ...finalize(resolved, detected.pm, true, 'cancelled'), result: 'cancelled' as const };
          if (jsonMode) outputJson(r);
          else logger.info('Cancelled by user.');
          process.exit(0);
        }
        throw err;
      }
    }

    const result = await execOrDryRunInstall(detected.pm, PKG, resolved.target, dryRun);
    const status: 'success' | 'cancelled' = dryRun ? 'cancelled' : 'success';
    const r = { ...finalize(resolved, detected.pm, dryRun, status), cmdStr: result.cmdStr };
    if (jsonMode) {
      outputJson(r);
    } else {
      logger.success(
        dryRun ? `[dry-run] Would downgrade ${PKG} to ${resolved.target}` : `Downgraded ${PKG} to ${resolved.target}`
      );
      if (!dryRun) logger.info('💡 Restart your shell to refresh PATH cache.');
    }
  },
});

export default downgradeCommand;
