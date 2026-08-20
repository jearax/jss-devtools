// Shared argument extraction for self commands.
// Centralizes the `args === true` pattern + type casts from citty's `args` record.
export interface SelfArgs {
  specVer?: string; // version spec (upgrade <spec>, downgrade <spec> only)
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
