export const isInteractive = (): boolean => Boolean(process.stdout.isTTY) && process.env['CI'] === undefined
