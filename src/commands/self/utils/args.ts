export interface SelfArgs {
  specVer?: string;

  yes: boolean;
  dryRun: boolean;
  json: boolean;
}

export const extractSelfArgs = (args: Record<string, unknown>): SelfArgs => ({
  specVer: typeof args.specVer === 'string' ? args.specVer : undefined,
  yes: args.yes === true,
  dryRun: args['dry-run'] === true,
  json: args.json === true,
});
