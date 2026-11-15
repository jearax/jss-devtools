import { StrictMode } from 'react';
import { type DataRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import Providers, { type ProviderComponent } from '@/components/Providers/Providers';
import FeatureFlagsProvider from '@/contexts/FeatureFlags/FeatureFlags';
import { reportRouterError } from '@/router/router';

const APP_PROVIDERS: readonly ProviderComponent[] = [StrictMode, ErrorBoundary, FeatureFlagsProvider];

export interface AppProps {
	router: DataRouter;
}

const App = ({ router }: AppProps) => {
	return (
		<Providers providers={APP_PROVIDERS}>
			<RouterProvider router={router} onError={reportRouterError} />
		</Providers>
	);
};

export default App;
