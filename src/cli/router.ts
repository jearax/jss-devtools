import { defineCommand } from 'citty';

import { PKG_INFO } from '@/utils/pkgInfo';

const routerCommand = defineCommand({
  meta: {
    name: PKG_INFO.name,
    version: PKG_INFO.version,
    description: PKG_INFO.description,
  },

  subCommands: {
    version: () => import('@/commands/version.js').then((m) => m.default),
    help: () => import('@/commands/help.js').then((m) => m.default),

    update: () => import('@/commands/self/update.js').then((m) => m.default),
    upgrade: () => import('@/commands/self/upgrade.js').then((m) => m.default),
    downgrade: () => import('@/commands/self/downgrade.js').then((m) => m.default),
    uninstall: () => import('@/commands/self/uninstall.js').then((m) => m.default),
  },

  run() {},
});

export default routerCommand;
