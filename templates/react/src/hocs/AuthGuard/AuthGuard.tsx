import { type ReactNode } from 'react';
import { Navigate } from 'react-router';

import useAuth from '@/hooks/useAuth/useAuth';
import { ROUTES } from '@/router/routes.constant';

export interface AuthGuardProps {
	children?: ReactNode | undefined;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
	const auth = useAuth();

	if (!auth.isAuthenticated) {
		return <Navigate to={ROUTES.LOGIN} replace />;
	}

	return children;
};

export default AuthGuard;
