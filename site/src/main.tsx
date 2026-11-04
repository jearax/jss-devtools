import { ThemeProvider } from '@jjuidev/design-system';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { createRouter } from '@/components/AppRouter/AppRouter';
import { JSS_DEVTOOLS_SKIN } from '@/styles/skins/jss-devtools.skin';

import './styles/styles.css';

const container = document.getElementById('root');

if (!container) {
	throw new Error('index.html is missing the #root element');
}

createRoot(container).render(
	<StrictMode>
		<ThemeProvider skins={[JSS_DEVTOOLS_SKIN]}>
			<RouterProvider router={createRouter()} />
		</ThemeProvider>
	</StrictMode>
);
