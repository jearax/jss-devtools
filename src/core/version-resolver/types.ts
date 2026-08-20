import type { AgentName } from 'package-manager-detector';

export type SpecKind = 'dist-tag' | 'exact' | 'range' | 'unknown';

export interface ParsedSpec {
  raw: string;
  kind: SpecKind;
  value: string; // tag name, exact version, or range string
}

export interface ResolveResult {
  target: string;
  current: string;
  direction: 'upgrade' | 'downgrade' | 'noop' | 'invalid';
  majorBump: boolean;
  message: string;
}

export interface DryRunResult {
  ok: boolean;
  dryRun: boolean;
  cmdStr: string;
  args: string[];
  pm: AgentName;
}
