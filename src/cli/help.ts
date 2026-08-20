import { renderUsage } from 'citty';

import routerCommand from '@/cli/router';
import { getBanner } from '@/utils/banner';

export const renderHelp = async (): Promise<string> => {
  const [banner, usage] = await Promise.all([Promise.resolve(getBanner()), renderUsage(routerCommand)]);

  return `${banner}\n\n${usage}`;
};
