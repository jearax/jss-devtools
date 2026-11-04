import { RouteObject, createBrowserRouter } from 'react-router';

import Layout from '@/components/Layout/Layout';
import { createDocsRoute } from '@/pages/Docs/Docs.route';
import Home from '@/pages/Home/Home';
import NotFound from '@/pages/NotFound/NotFound';

/**
 * The router consumes a route object as it loads it, so the tree is built fresh for every
 * router: a shared one would hand the second router a tree with its thunks already spent.
 */
export const createRoutes = (): RouteObject[] => {
	return [
		{
			path: '/',
			element: <Layout />,
			children: [
				{
					index: true,
					element: <Home />
				},
				{
					// The Docs area is lazy per route, so the home route ships none of it.
					path: 'docs',
					...createDocsRoute()
				},
				{
					path: '*',
					element: <NotFound />
				}
			]
		}
	];
};

export const createRouter = () => {
	return createBrowserRouter(createRoutes());
};
