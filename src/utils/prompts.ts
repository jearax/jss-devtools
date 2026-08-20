import { confirm } from '@clack/prompts';

export const isTTY = (): boolean => Boolean(process.stdout.isTTY);

export const confirmOrThrow = async (message: string): Promise<void> => {
  const ok = await confirm({ message });

  if (!ok) {
    throw new Error('USER_CANCELLED');
  }
};
