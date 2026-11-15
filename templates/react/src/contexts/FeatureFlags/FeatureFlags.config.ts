import { OpenFeature, TypedInMemoryProvider } from '@openfeature/react-sdk';

import { reportError } from '@/services/error-reporting.service';

const FEATURE_FLAGS_INIT_TIMEOUT_MS = 3000;

export const SIDEBAR_FLAG_KEY = 'sidebar';

const flagConfiguration = {
	sidebar: {
		variants: {
			on: true,
			off: false
		},
		defaultVariant: import.meta.env.VITE_FEATURE_SIDEBAR === 'false' ? 'off' : 'on',
		disabled: false
	}
} as const;

// A slow or failing provider must not block the app: hooks fall back to their default values.
export const initFeatureFlags = async (timeoutMs = FEATURE_FLAGS_INIT_TIMEOUT_MS) => {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`Feature flag provider not ready after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	try {
		await Promise.race([OpenFeature.setProviderAndWait(new TypedInMemoryProvider(flagConfiguration)), timeout]);
	} catch (error) {
		reportError(error, { source: 'feature-flags' });
	} finally {
		clearTimeout(timeoutId);
	}
};
