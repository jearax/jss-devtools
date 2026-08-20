// `jss-devtools uninstall` — remove CLI from global.
import { defineCommand } from 'citty';

import { execOrDryRunRemove } from '@/core/self-installer/exec';
import { CLI_META } from '@/utils/constants.ts';

import { extractSelfArgs } from '@/commands/self/utils/args.ts';
import { confirmOrCancel, requireGlobalPM } from '@/commands/self/utils/flow.ts';
import { printJson } from '@/commands/self/utils/output.ts';
import { type CommandResultStatus, baseResult, printSuccess } from '@/commands/self/utils/result.ts';

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

    const detected = await requireGlobalPM(CLI_META.name, options);

    await confirmOrCancel(options, `Uninstall ${CLI_META.name}@${detected.version} from ${detected.pm}?`, {
      ...baseResult(detected.pm, CLI_META.name, false),
      command: 'uninstall',
      result: 'cancelled' as CommandResultStatus,
      current: detected.version,
      message: 'Cancelled by user',
    });

    const result = await execOrDryRunRemove(detected.pm, CLI_META.name, dryRun);

    if (jsonMode) {
      printJson({
        ...baseResult(detected.pm, CLI_META.name, dryRun),
        command: 'uninstall',
        result: (dryRun ? 'cancelled' : 'success') as CommandResultStatus,
        current: detected.version,
        cmdStr: result.cmdStr,
        message: dryRun
          ? `[dry-run] Would uninstall ${CLI_META.name}@${detected.version}`
          : `Uninstalled ${CLI_META.name}@${detected.version}`,
      });
    } else {
      printSuccess(`Uninstall ${CLI_META.name}@${detected.version}`, dryRun);
    }
  },
});

export default uninstallCommand;
