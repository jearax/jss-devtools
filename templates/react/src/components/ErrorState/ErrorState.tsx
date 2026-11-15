export interface ErrorStateProps {
	title: string;
	details?: string | undefined;
	onRetry?: (() => void) | undefined;
}

const ErrorState = ({ title, details, onRetry }: ErrorStateProps) => {
	return (
		<section role="alert">
			<h1>{title}</h1>
			{details && <p>{details}</p>}
			{onRetry && (
				<button type="button" onClick={onRetry}>
					Try again
				</button>
			)}
		</section>
	);
};

export default ErrorState;
