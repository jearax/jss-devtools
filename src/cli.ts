import { runMain } from 'citty'

import routerCommand from '@/cli/router'
import { logger } from '@/utils/logger'

process.on('uncaughtException', (err) => logger.error(String(err)))
process.on('unhandledRejection', (err) => logger.error(String(err)))

runMain(routerCommand)
