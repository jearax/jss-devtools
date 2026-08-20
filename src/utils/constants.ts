import pkg from '../../package.json' with { type: 'json' };

export const CLI_META = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  bannerFont: 'Standard' as const,
};
