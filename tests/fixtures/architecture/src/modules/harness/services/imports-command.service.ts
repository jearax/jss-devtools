import { sample } from '../../../commands/doctor/services/sample.service';

export const read = (): string => {
	return sample();
};
