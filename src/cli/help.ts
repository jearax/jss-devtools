// Help rendering helper — shared between top-level --help intercept and `help` subcommand.
// Returns banner + citty's auto-generated usage as a single string.
import { renderUsage } from 'citty';

import routerCommand from '@/cli/router.js';
import { getBanner } from '@/utils/banner.js';

export const renderHelp = async (): Promise<string> => {
  const [banner, usage] = await Promise.all([Promise.resolve(getBanner()), renderUsage(routerCommand)]);
  return `${banner}\n\n${usage}`;
};
