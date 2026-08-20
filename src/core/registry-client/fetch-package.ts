import type { PackageMetadata } from '@/core/registry-client/types';

const REGISTRY = 'https://registry.npmjs.org';
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const fetchPackageMetadata = async (pkg: string, signal?: AbortSignal): Promise<PackageMetadata> => {
  const url = `${REGISTRY}/${encodeURIComponent(pkg)}`;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const externalSignal = signal;

      if (externalSignal) {
        externalSignal.addEventListener('abort', () => controller.abort(), {
          once: true,
        });
      }

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Registry returned ${res.status}`);
        }

        return (await res.json()) as PackageMetadata;
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(500);
      }
    }
  }

  throw new Error(`Failed to fetch ${pkg} from registry: ${String(lastError)}`);
};
