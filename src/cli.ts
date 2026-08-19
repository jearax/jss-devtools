// Bin entry — invoked by `jss-devtools` command (resolved via package.json `bin` field).
// Delegates to citty router for arg parsing + command dispatch.
// Shebang `#!/usr/bin/env node` is injected by tsup banner config — do not duplicate here.
import { runMain } from 'citty';
import { mainCommand } from './cli/router.js';

runMain(mainCommand);
