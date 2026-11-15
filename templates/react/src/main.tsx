import { createRoot } from 'react-dom/client';

import App from '@/App';
import { initFeatureFlags } from '@/contexts/FeatureFlags/FeatureFlags.config';
import { createAppRouter } from '@/router/router';

const bootstrap = async () => {
	const container = document.querySelector('#root');

	if (!container) {
		throw new Error("No element '#root' is defined in index.html!");
	}

	const router = createAppRouter();

	await initFeatureFlags();

	createRoot(container).render(<App router={router} />);
};

void bootstrap();
