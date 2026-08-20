import { confirm } from '@clack/prompts';

export const isTTY = (): boolean => Boolean(process.stdout.isTTY);

export const confirmYes = async (message: string): Promise<boolean> => {
  return Boolean(await confirm({ message }));
};
