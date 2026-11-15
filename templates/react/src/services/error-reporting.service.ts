export type ErrorSource = 'app' | 'router' | 'feature-flags';

export type ErrorReport = {
	source: ErrorSource;
	componentStack?: string | undefined;
	route?: {
		pathname: string;
		pattern: string;
		params: Record<string, string | undefined>;
	};
};

export type ErrorReporter = (error: unknown, report: ErrorReport) => void;

const devConsoleReporter: ErrorReporter = (error, report) => {
	if (import.meta.env.DEV) {
		console.error('[error-reporting]', error, report);
	}
};

let activeReporter: ErrorReporter = devConsoleReporter;

// Without an argument the development console reporter is restored, so a test or a host can undo its own reporter.
export const setErrorReporter = (reporter: ErrorReporter = devConsoleReporter) => {
	activeReporter = reporter;
};

export const reportError: ErrorReporter = (error, report) => {
	try {
		activeReporter(error, report);
	} catch (reporterError) {
		// A broken reporter must never break the error UI that called it.
		console.error('[error-reporting] reporter failed', reporterError);
	}
};
