/** `status` always equals the HTTP status. */
export type ApiResponse<T> = {
	status: number;
	message: string;
	data: T;
};

export type ValidationError = {
	path: string;
	code: string | null;
	message: string;
};
