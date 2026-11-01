import { createDoctorContext } from '@/commands/doctor/services/doctor.service';

export const run = (): Promise<unknown> => {
	return createDoctorContext();
};
