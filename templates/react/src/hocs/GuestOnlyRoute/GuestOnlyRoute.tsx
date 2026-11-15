import { type ReactNode } from 'react';
import { Navigate } from 'react-router';

import useAuth from '@/hooks/useAuth/useAuth';
import { ROUTES } from '@/router/routes.constant';

export interface GuestOnlyRouteProps {
	children?: ReactNode | undefined;
}

const GuestOnlyRoute = ({ children }: GuestOnlyRouteProps) => {
	const auth = useAuth();

	if (auth.isAuthenticated) {
		return <Navigate to={ROUTES.HOME} replace />;
	}

	return children;
};

export default GuestOnlyRoute;
