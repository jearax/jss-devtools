import { getErrorMessage } from 'react-error-boundary';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import ErrorState from '@/components/ErrorState/ErrorState';
import BadRequest from '@/pages/illustrators/BadRequest/BadRequest';
import NotFound from '@/pages/illustrators/NotFound/NotFound';
import ServerError from '@/pages/illustrators/ServerError/ServerError';

const RouteErrorBoundary = () => {
	const error = useRouteError();

	if (isRouteErrorResponse(error) && error.status === 400) {
		return <BadRequest />;
	}

	if (isRouteErrorResponse(error) && error.status === 404) {
		return <NotFound />;
	}

	if (isRouteErrorResponse(error) && error.status >= 500) {
		return <ServerError />;
	}

	const describeError = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : getErrorMessage(error);

	return <ErrorState title="Something went wrong" details={import.meta.env.DEV ? describeError : undefined} />;
};

export default RouteErrorBoundary;
