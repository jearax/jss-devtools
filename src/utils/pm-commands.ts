// Per-PM command builders for global install/remove.
// Each PM has its own flag conventions; yarn classic uses `global <verb>`,
// others use `<verb> -g`.
import type { PM } from '@/core/global-pm-detector/types.js';

type InstallVerb = 'install' | 'add' | 'global';
type RemoveVerb = 'uninstall' | 'remove' | 'global';

interface PMCommands {
  install: (pm: PM, pkg: string, version: string) => string[];
  remove: (pm: PM, pkg: string) => string[];
  listGlobal: (pm: PM, pkg?: string) => string[];
}

const COMMANDS: Record<PM, { install: InstallVerb; remove: RemoveVerb }> = {
  npm: { install: 'install', remove: 'uninstall' },
  pnpm: { install: 'add', remove: 'remove' },
  yarn: { install: 'global', remove: 'global' },
  bun: { install: 'install', remove: 'remove' },
};

const YARN_REMOVE_SUFFIX = 'remove';

export const buildUpgradeCommand = (pm: PM, pkg: string, version: string): string[] => {
  const cfg = COMMANDS[pm];
  if (pm === 'yarn') return ['global', 'add', `${pkg}@${version}`];
  return [cfg.install, '-g', `${pkg}@${version}`];
};

export const buildRemoveCommand = (pm: PM, pkg: string): string[] => {
  const cfg = COMMANDS[pm];
  if (pm === 'yarn') return ['global', YARN_REMOVE_SUFFIX, pkg];
  return [cfg.remove, '-g', pkg];
};

export const buildListGlobalCommand = (pm: PM, pkg?: string): string[] => {
  if (pm === 'npm') return pkg ? ['ls', '-g', pkg, '--depth=0', '--json'] : ['ls', '-g', '--depth=0', '--json'];
  if (pm === 'pnpm') return pkg ? ['list', '-g', pkg, '--depth=0', '--json'] : ['list', '-g', '--depth=0', '--json'];
  if (pm === 'yarn') return ['global', 'list', '--json'];
  return pkg ? ['pm', 'ls', '-g', pkg] : ['pm', 'ls', '-g'];
};

export const PM_DISPLAY_NAMES: Record<PM, string> = {
  npm: 'npm',
  pnpm: 'pnpm',
  yarn: 'yarn (classic)',
  bun: 'bun',
};
