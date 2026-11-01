import { read } from '../../harness/services/imports-command.service';

export const use = (): string => {
	return read();
};
