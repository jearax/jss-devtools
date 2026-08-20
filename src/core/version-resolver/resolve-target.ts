// Resolve a version spec (dist-tag, exact, or semver range) against package metadata.
// Returns the resolved target version + direction (upgrade/downgrade/noop/invalid)
// relative to the user's current version.
import semver from 'semver';

import type { PackageMetadata } from '@/core/registry-client/types.js';

import type { ParsedSpec, ResolveResult } from './types.js';

export type { ParsedSpec, ResolveResult } from './types.js';

export const parseSpec = (raw: string): ParsedSpec => {
  const trimmed = raw.trim();
  if (!trimmed) return { raw, kind: 'unknown', value: '' };
  if (semver.valid(trimmed)) return { raw, kind: 'exact', value: trimmed };
  if (semver.validRange(trimmed)) return { raw, kind: 'range', value: trimmed };
  // Could be a dist-tag — caller verifies against metadata
  return { raw, kind: 'dist-tag', value: trimmed };
};

const isStable = (v: string) => Boolean(semver.valid(v)) && !semver.prerelease(v);

const stableVersions = (versions: string[]): string[] => versions.filter(isStable).sort(semver.rcompare);

const resolveFromSpec = (spec: ParsedSpec, meta: PackageMetadata): string | null => {
  if (spec.kind === 'exact') {
    return meta.versions.includes(spec.value) ? spec.value : null;
  }
  if (spec.kind === 'dist-tag') {
    return meta['dist-tags'][spec.value] ?? null;
  }
  if (spec.kind === 'range') {
    const stable = stableVersions(meta.versions);
    return stable.find((v) => semver.satisfies(v, spec.value, { includePrerelease: false })) ?? null;
  }
  return null;
};

const isMajorBump = (from: string, to: string): boolean => semver.major(from) !== semver.major(to);

export const resolveTarget = (
  spec: ParsedSpec | undefined,
  current: string,
  meta: PackageMetadata,
  direction: 'upgrade' | 'downgrade'
): ResolveResult => {
  let target: string | null;
  let displaySpec: string;

  if (spec === undefined) {
    target = meta['dist-tags'].latest ?? stableVersions(meta.versions)[0] ?? null;
    displaySpec = 'latest';
  } else {
    target = resolveFromSpec(spec, meta);
    displaySpec = spec.raw;
  }

  if (!target) {
    return {
      target: '',
      current,
      direction: 'invalid',
      majorBump: false,
      message: spec ? `No version matches spec '${displaySpec}'` : 'No stable version found',
    };
  }

  if (target === current) {
    return {
      target,
      current,
      direction: 'noop',
      majorBump: false,
      message: `Already at ${target}`,
    };
  }

  const targetIsNewer = semver.gt(target, current);
  const actualDirection: 'upgrade' | 'downgrade' = targetIsNewer ? 'upgrade' : 'downgrade';

  if (actualDirection !== direction) {
    return {
      target,
      current,
      direction: 'invalid',
      majorBump: false,
      message:
        direction === 'upgrade'
          ? `Spec '${displaySpec}' resolves to ${target} which is OLDER than current ${current}. Use 'downgrade' instead.`
          : `Spec '${displaySpec}' resolves to ${target} which is NEWER than current ${current}. Use 'upgrade' instead.`,
    };
  }

  return {
    target,
    current,
    direction: actualDirection,
    majorBump: isMajorBump(current, target),
    message: `${actualDirection === 'upgrade' ? 'Upgrade' : 'Downgrade'} from ${current} to ${target}`,
  };
};
