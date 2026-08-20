// Bin entry — injected by tsup banner config, do not duplicate shebang here.
//
// intercepts --help/-h and --version/-v before runMain because:
// 1. Citty 0.2.x exposes no custom help renderer (verified via citty source).
// 2. Citty's auto --version just prints meta.version (no banner); we want branded.
import { renderUsage, runMain } from 'citty';

import routerCommand from '@/cli/router';
import { getBanner } from '@/utils/banner';
import { logger } from '@/utils/logger';
import { PKG_INFO } from '@/utils/pkgInfo';

process.on('uncaughtException', (err) => logger.error(String(err)));
process.on('unhandledRejection', (err) => logger.error(String(err)));

const args = process.argv.slice(2);
const isHelp = args.includes('--help') || args.includes('-h');
const isVersion = args.includes('--version') || args.includes('-v');

if (isHelp) {
  const KNOWN_FLAGS = new Set(['--yes', '--dry-run', '--json', '-y', '-h']);
  const subcommand = args.find((a) => !a.startsWith('-') && !KNOWN_FLAGS.has(a));
  let usage = '';
  const subs = routerCommand.subCommands;
  if (subcommand && subs && subcommand in subs) {
    const resolver = (subs as Record<string, unknown>)[subcommand];
    const resolved = typeof resolver === 'function' ? await (resolver as () => Promise<unknown>)() : resolver;
    if (resolved && typeof resolved === 'object' && 'meta' in resolved) {
      usage = await renderUsage(resolved as Parameters<typeof renderUsage>[0]);
    }
  }
  if (!usage) {
    usage = await renderUsage(routerCommand);
  }
  // Direct sync write — consola's async reporter truncates when execSync returns.
  process.stdout.write(`${getBanner()}\n\n${usage}\n`);
  process.exit(0);
}

if (isVersion) {
  // Direct sync write for the same reason.
  process.stdout.write(`${getBanner()}\n${PKG_INFO.version}\n`);
  process.exit(0);
}

runMain(routerCommand);
