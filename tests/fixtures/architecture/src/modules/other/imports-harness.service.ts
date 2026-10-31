import { read } from '../harness/imports-command.service';

export const use = (): string => {
	return read();
};
