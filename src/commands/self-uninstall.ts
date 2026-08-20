import { defineCommand } from 'citty';

import { detectGlobalPM } from '@/core/global-pm-detector/index.js';
import { execOrDryRunRemove } from '@/core/self-installer/index.js';
import { logger } from '@/utils/logger.js';
import { confirmOrThrow, isTTY } from '@/utils/prompts.js';

const PKG = 'jss-devtools';

const outputJson = (result: object) => {
  console.log(JSON.stringify(result, null, 2));
};

export const uninstallCommand = defineCommand({
  meta: {
    name: 'uninstall',
    description: 'Uninstall CLI from global',
  },
  args: {
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
    const detected = await detectGlobalPM(PKG);
    if (!detected) {
      const msg = `${PKG} not installed via any known package manager.`;
      if (args.json)
        outputJson({
          schemaVersion: '1.0',
          command: 'uninstall',
          result: 'error',
          error: { code: 'PM_NOT_DETECTED', message: msg },
        });
      else logger.error(msg);
      process.exit(1);
    }

    if (!args.yes && isTTY()) {
      try {
        await confirmOrThrow(`Uninstall ${PKG}@${detected.version} from ${detected.pm}?`);
      } catch (err) {
        if (String(err).includes('USER_CANCELLED')) {
          const r = {
            schemaVersion: '1.0',
            command: 'uninstall',
            result: 'cancelled' as const,
            pm: detected.pm,
            package: PKG,
            current: detected.version,
            dryRun: false,
            message: 'Cancelled by user',
          };
          if (args.json) outputJson(r);
          else logger.info('Cancelled by user.');
          process.exit(0);
        }
        throw err;
      }
    }

    const result = await execOrDryRunRemove(detected.pm, PKG, args['dry-run'] === true);

    if (args.json) {
      outputJson({
        schemaVersion: '1.0',
        command: 'uninstall',
        result: args['dry-run'] ? 'cancelled' : 'success',
        pm: detected.pm,
        package: PKG,
        current: detected.version,
        dryRun: args['dry-run'] === true,
        cmdStr: result.cmdStr,
        message: args['dry-run']
          ? `[dry-run] Would uninstall ${PKG}@${detected.version}`
          : `Uninstalled ${PKG}@${detected.version}`,
      });
    } else {
      logger.success(
        args['dry-run']
          ? `[dry-run] Would uninstall ${PKG}@${detected.version}`
          : `Uninstalled ${PKG}@${detected.version}`
      );
      if (!args['dry-run']) logger.info('💡 Restart your shell to refresh PATH cache.');
    }
  },
});

export default uninstallCommand;
