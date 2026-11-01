import { read } from '../../modules/harness/services/imports-command.service';

export const run = (): string => {
	return read();
};
