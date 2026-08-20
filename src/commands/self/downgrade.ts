// `jss-devtools downgrade` — mirror of upgrade with inverse direction.
import { defineCommand } from 'citty';

import { fetchPackageMetadata } from '@/core/registry-client/fetch-package';
import { execOrDryRunInstall } from '@/core/self-installer/exec';
import { parseSpec, resolveTarget } from '@/core/version-resolver/resolve-target';
import { logger } from '@/utils/logger';

import { extractSelfArgs } from '@/commands/self/utils/args';
import { confirmOrCancel, requireGlobalPM } from '@/commands/self/utils/flow';
import { printJson } from '@/commands/self/utils/output';
import { type CommandResultStatus, baseResult, printSuccess } from '@/commands/self/utils/result';

const PKG = 'jss-devtools';

const downgradeCommand = defineCommand({
  meta: {
    name: 'downgrade',
    description: 'Downgrade CLI to previous or specified version',
  },
  args: {
    specVer: {
      type: 'positional',
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
    const { dryRun, json: jsonMode, yes, specVer } = extractSelfArgs(args);
    const options = { json: jsonMode, yes };

    const detected = await requireGlobalPM(PKG, options);
    const meta = await fetchPackageMetadata(PKG);
    const spec = specVer ? parseSpec(specVer) : undefined;
    const resolved = resolveTarget(spec, detected.version, meta, 'downgrade');

    if (resolved.direction === 'invalid') {
      const result = {
        ...baseResult(detected.pm, PKG, false),
        command: 'downgrade',
        result: 'error' as CommandResultStatus,
        spec: args.specVer ?? null,
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
        command: 'downgrade',
        result: 'noop' as CommandResultStatus,
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

    await confirmOrCancel(
      options,
      `Downgrade ${PKG} from ${resolved.current} to ${resolved.target} via ${detected.pm}?\nWill run: ${detected.pm} add -g ${PKG}@${resolved.target}`,
      {
        ...baseResult(detected.pm, PKG, true),
        command: 'downgrade',
        result: 'cancelled' as CommandResultStatus,
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
        command: 'downgrade',
        result: (dryRun ? 'cancelled' : 'success') as CommandResultStatus,
        current: detected.version,
        target: resolved.target,
        majorBump: resolved.majorBump,
        cmdStr: result.cmdStr,
        message: dryRun
          ? `[dry-run] Would downgrade ${PKG} to ${resolved.target}`
          : `Downgraded ${PKG} to ${resolved.target}`,
      });
    } else {
      printSuccess(`Downgrade ${PKG} to ${resolved.target}`, dryRun);
    }
  },
});

export default downgradeCommand;
