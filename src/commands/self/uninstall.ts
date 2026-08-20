// `jss-devtools uninstall` — remove CLI from global.
import { defineCommand } from 'citty';

import { execOrDryRunRemove } from '@/core/self-installer/exec.js';
import { CLI_META } from '@/utils/constants.js';

import { confirmOrCancel, requireGlobalPM } from './utils/flow.js';
import { printJson } from './utils/output.js';
import { type CommandResultStatus, baseResult, printSuccess } from './utils/result.js';

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
    const options = { json: jsonMode, yes: args.yes === true };

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
