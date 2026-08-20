// Detect which package manager installed the CLI globally.
// Strategy: probe each PM sequentially (pnpm > npm > yarn classic > bun),
// first one whose `list -g` mentions the package wins.
// Result cached per-process to avoid repeated subprocess calls.
import { execa } from 'execa';

import { logger } from '@/utils/logger.js';

import type { AgentName } from 'package-manager-detector';

import type { DetectedPM } from './types.js';

// Per-PM list-global command (no equivalent in package-manager-detector).
const LIST_GLOBAL_COMMANDS: Record<AgentName, string[]> = {
  npm: ['ls', '-g', '--depth=0', '--json'],
  pnpm: ['list', '-g', '--depth=0', '--json'],
  yarn: ['global', 'list', '--json'],
  bun: ['pm', 'ls', '-g'],
  deno: [], // deno not used
  nub: [], // alias for pnpm
  aube: [], // alias for npm
};

export const PM_DISPLAY_NAMES: Record<AgentName, string> = {
  npm: 'npm',
  pnpm: 'pnpm',
  yarn: 'yarn (classic)',
  bun: 'bun',
  deno: 'deno',
  nub: 'nub',
  aube: 'aube',
};

const PROBE_ORDER: AgentName[] = ['pnpm', 'npm', 'yarn', 'bun'];

let cached: DetectedPM | null = null;

const parseVersionFromList = (pm: AgentName, stdout: string, pkg: string): string | null => {
  try {
    if (pm === 'npm') {
      const parsed: { dependencies?: Record<string, unknown> } = JSON.parse(stdout);
      const deps = parsed.dependencies ?? {};
      const key = Object.keys(deps).find((k) => k.startsWith(`${pkg}@`));
      return key ? key.slice(`${pkg}@`.length) : null;
    }
    if (pm === 'pnpm') {
      const arr: { name?: string; version?: string }[] = JSON.parse(stdout);
      const found = Array.isArray(arr) ? arr.find((p) => p.name === pkg) : null;
      return found?.version ?? null;
    }
    if (pm === 'yarn') {
      const parsed: { data?: unknown[] } = JSON.parse(stdout);
      const data = Array.isArray(parsed.data) ? parsed.data : [];
      const found = data.find((row: unknown) => {
        if (!Array.isArray(row)) return false;
        const name = row[0];
        if (typeof name !== 'string') return false;
        return name === pkg || name.startsWith(`${pkg}@`);
      });
      if (!Array.isArray(found) || typeof found[0] !== 'string') return null;
      return found[0].slice(`${pkg}@`.length);
    }
    // bun: parse name@version strings
    const line = stdout.split('\n').find((l) => l.includes(`${pkg}@`));
    return line ? (line.match(new RegExp(`${pkg}@(\\d+\\.\\d+\\.\\d+.*?)`))?.[1] ?? null) : null;
  } catch {
    return null;
  }
};

export const detectGlobalPM = async (pkg: string): Promise<DetectedPM | null> => {
  if (cached !== null) return cached;
  for (const pm of PROBE_ORDER) {
    const args = LIST_GLOBAL_COMMANDS[pm];
    if (args.length === 0) continue;
    try {
      const { stdout, exitCode } = await execa(pm, args, { reject: false });
      if (exitCode !== 0) continue;
      const version = parseVersionFromList(pm, stdout, pkg);
      if (version) {
        cached = { pm, version };
        logger.debug(`Detected ${PM_DISPLAY_NAMES[pm]} installed ${pkg}@${version}`);
        return cached;
      }
    } catch {
      // PM not installed or other error — try next
    }
  }
  cached = null;
  return null;
};

export const resetDetectionCache = (): void => {
  cached = null;
};
