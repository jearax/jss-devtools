import { defineCommand } from 'citty';

import { displayBanner } from '@/utils/banner';
import { CLI_META } from '@/utils/constants';

const versionCommand = defineCommand({
  meta: {
    name: 'version',
    description: 'Print CLI version',
  },

  run() {
    displayBanner();
    console.log(CLI_META.version);
  },
});

export default versionCommand;
