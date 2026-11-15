import { type ComponentType, type ReactNode } from 'react';
import { type ClientOnErrorFunction, createBrowserRouter, isRouteErrorResponse, type RouteObject } from 'react-router';

import MainLayout from '@/components/layouts/MainLayout/MainLayout';
import RouteErrorBoundary from '@/components/RouteErrorBoundary/RouteErrorBoundary';
import AuthGuard from '@/hocs/AuthGuard/AuthGuard';
import GuestOnlyRoute from '@/hocs/GuestOnlyRoute/GuestOnlyRoute';
import NotFound from '@/pages/illustrators/NotFound/NotFound';
import { ROUTES } from '@/router/routes.constant';
import { reportError } from '@/services/error-reporting.service';

type PageModule = { default: ComponentType };

const lazyPage = (importPage: () => Promise<PageModule>, Guard?: ComponentType<{ children: ReactNode }>) => {
	return async () => {
		const { default: Page } = await importPage();

		if (!Guard) {
			return { Component: Page };
		}

		return {
			element: (
				<Guard>
					<Page />
				</Guard>
			)
		};
	};
};

export const routes: RouteObject[] = [
	{
		Component: MainLayout,
		ErrorBoundary: RouteErrorBoundary,
		children: [
			{
				index: true,
				lazy: lazyPage(() => {
					return import('@/pages/Home/Home');
				})
			},
			{
				path: ROUTES.LOGIN,
				lazy: lazyPage(() => {
					return import('@/pages/auth/Login/Login');
				}, GuestOnlyRoute)
			},
			{
				path: ROUTES.DASHBOARD,
				lazy: lazyPage(() => {
					return import('@/pages/Dashboard/Dashboard');
				}, AuthGuard)
			},
			{
				path: '*',
				Component: NotFound
			}
		]
	}
];

export const createAppRouter = () => {
	return createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
};

// Thrown 4xx responses (401, 403, 404) are expected outcomes, not incidents.
export const reportRouterError: ClientOnErrorFunction = (error, info) => {
	if (isRouteErrorResponse(error) && error.status < 500) {
		return;
	}

	reportError(error, {
		source: 'router',
		componentStack: info.errorInfo?.componentStack ?? undefined,
		route: {
			pathname: info.location.pathname,
			pattern: info.pattern,
			params: info.params
		}
	});
};
