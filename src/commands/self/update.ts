// `jss-devtools update` — restricted semantics:
//   - no args: alias of upgrade (auto-pick latest)
//   - `check`: read-only inspection (5 latest versions grouped by major)
//   - `<spec>`: ERROR — use `upgrade <spec>` instead
import { defineCommand } from 'citty';
import semver from 'semver';

import { fetchPackageMetadata } from '@/core/registry-client/index.js';
import { logger } from '@/utils/logger.js';

import { runUpgradeFlow } from './utils/update-shared.js';

const updateCommand = defineCommand({
  meta: {
    name: 'update',
    description: 'Update CLI (alias of upgrade) or check available versions',
  },
  subCommands: {
    check: () => import('./update-check.js').then((m) => m.default),
  },
  async run() {
    // `update <spec>` rejected: spec must use `upgrade <spec>`.
    // citty auto-rejects unknown subcommands; this run() fires only when no
    // subcommand matches, so we just delegate to upgrade flow.
    await runUpgradeFlow({}, 'update');
  },
});

// Helper for `update check` — exported for testing
export const fetchAndDisplayUpdates = async (pkg: string, currentVersion: string, jsonMode: boolean): Promise<void> => {
  const meta = await fetchPackageMetadata(pkg);
  const all = meta.versions.filter((v) => semver.valid(v) && !semver.prerelease(v));
  const byMajor = new Map<number, string>();
  for (const v of all) {
    const major = semver.major(v);
    const existing = byMajor.get(major);
    if (!existing || semver.gt(v, existing)) {
      byMajor.set(major, v);
    }
  }
  const sorted = [...byMajor.values()].sort(semver.rcompare).slice(0, 5);
  const latest = meta['dist-tags'].latest ?? sorted[0] ?? currentVersion;
  const hasUpdate = semver.gt(latest, currentVersion);

  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          schemaVersion: '1.0',
          command: 'update check',
          result: 'noop',
          package: pkg,
          current: currentVersion,
          latestStable: latest,
          hasUpdate,
          versions: sorted.map((v) => ({
            version: v,
            releasedAt: meta.time?.[v] ?? null,
            current: v === currentVersion,
          })),
        },
        null,
        2
      )
    );
    return;
  }

  logger.info(`Available versions of ${pkg} (latest stable per major):`);
  for (const v of sorted) {
    const date = meta.time?.[v]?.slice(0, 10) ?? 'unknown';
    const marker = v === currentVersion ? ' ← current' : '';
    console.log(`  ${v.padEnd(10)} ${date}${marker}`);
  }
  console.log('');
  if (hasUpdate) {
    logger.info(`Run \`jss-devtools upgrade\` to update to ${latest}.`);
  } else {
    logger.info('Already at latest.');
  }
};

export default updateCommand;
