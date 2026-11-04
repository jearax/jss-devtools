import { ComponentType } from 'react';
import { redirect, RouteObject } from 'react-router';

type PageModule = { default: ComponentType };

/**
 * The route tree has to be static: the router matches the paths before it loads anything, so a
 * lazy route cannot bring its own children. The docs area is therefore lazy per route. The
 * route object itself is a few import thunks, so the home route ships none of the docs.
 */
const lazyPage = (load: () => Promise<PageModule>): Pick<RouteObject, 'lazy'> => {
	return {
		lazy: {
			Component: async () => {
				const module = await load();

				return module.default;
			}
		}
	};
};

/**
 * The docs area. The index redirects to the first page, so every docs page has exactly one
 * address and the sidebar can mark the current one.
 *
 * The router consumes a route object as it loads it, so the tree is built fresh for every
 * router: a shared one would hand the second router a tree with its thunks already spent.
 */
export const createDocsRoute = (): RouteObject => {
	return {
		...lazyPage(() => {
			return import('@/pages/Docs/Docs');
		}),
		children: [
			{
				index: true,
				loader: () => {
					return redirect('/docs/getting-started');
				}
			},
			{
				path: 'getting-started',
				...lazyPage(() => {
					return import('@/pages/Docs/pages/GettingStarted/GettingStarted');
				})
			},
			{
				path: 'install',
				...lazyPage(() => {
					return import('@/pages/Docs/pages/Install/Install');
				})
			},
			{
				path: 'init',
				...lazyPage(() => {
					return import('@/pages/Docs/pages/Init/Init');
				})
			},
			{
				path: 'doctor',
				...lazyPage(() => {
					return import('@/pages/Docs/pages/Doctor/Doctor');
				})
			},
			{
				path: 'harness',
				...lazyPage(() => {
					return import('@/pages/Docs/pages/Harness/Harness');
				})
			},
			{
				path: 'reference',
				...lazyPage(() => {
					return import('@/pages/Docs/pages/Reference/Reference');
				})
			}
		]
	};
};
