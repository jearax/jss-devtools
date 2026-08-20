// `jss-devtools uninstall` — remove CLI from global.
import { defineCommand } from 'citty';

import { execOrDryRunRemove } from '@/core/self-installer/exec';
import { PKG_INFO } from '@/utils/pkgInfo';

import { extractSelfArgs } from '@/commands/self/utils/args';
import { confirmOrCancel, requireGlobalPM } from '@/commands/self/utils/flow';
import { printJson } from '@/commands/self/utils/output';
import { type CommandResultStatus, baseResult, printSuccess } from '@/commands/self/utils/result';

const uninstallCommand = defineCommand({
  meta: {
    name: 'uninstall',
    description: 'Uninstall CLI from global',
  },
  args: {
    yes: {
      type: 'boolean',
      description: 'Skip confirmation prompt',
      default: false,
      alias: 'y',
    },
    'dry-run': {
      type: 'boolean',
      description: 'Print command without executing',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Output structured JSON',
      default: true,
    },
  },
  async run({ args }) {
    const { dryRun, json: jsonMode, yes } = extractSelfArgs(args);
    const options = { json: jsonMode, yes };

    const detected = await requireGlobalPM(PKG_INFO.name, options);

    await confirmOrCancel(options, `Uninstall ${PKG_INFO.name}@${detected.version} from ${detected.pm}?`, {
      ...baseResult(detected.pm, PKG_INFO.name, false),
      command: 'uninstall',
      result: 'cancelled' as CommandResultStatus,
      current: detected.version,
      message: 'Cancelled by user',
    });

    const result = await execOrDryRunRemove(detected.pm, PKG_INFO.name, dryRun);

    if (jsonMode) {
      printJson({
        ...baseResult(detected.pm, PKG_INFO.name, dryRun),
        command: 'uninstall',
        result: (dryRun ? 'cancelled' : 'success') as CommandResultStatus,
        current: detected.version,
        cmdStr: result.cmdStr,
        message: dryRun
          ? `[dry-run] Would uninstall ${PKG_INFO.name}@${detected.version}`
          : `Uninstalled ${PKG_INFO.name}@${detected.version}`,
      });
    } else {
      printSuccess(`Uninstall ${PKG_INFO.name}@${detected.version}`, dryRun);
    }
  },
});

export default uninstallCommand;
