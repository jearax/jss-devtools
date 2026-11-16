import { type ErrorInfo, type PropsWithChildren } from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps, getErrorMessage } from 'react-error-boundary';

import ErrorState from '@/components/ErrorState/ErrorState';
import { reportError } from '@/services/error-reporting.service';

export interface ErrorBoundaryProps extends PropsWithChildren {}

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
	return (
		<ErrorState
			title="Something went wrong"
			details={import.meta.env.DEV ? getErrorMessage(error) : undefined}
			onRetry={resetErrorBoundary}
		/>
	);
};

const handleError = (error: unknown, info: ErrorInfo) => {
	reportError(error, {
		source: 'app',
		componentStack: info.componentStack ?? undefined
	});
};

const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
	return (
		<ReactErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
			{children}
		</ReactErrorBoundary>
	);
};

export default ErrorBoundary;
