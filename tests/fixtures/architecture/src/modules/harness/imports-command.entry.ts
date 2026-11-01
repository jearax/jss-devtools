import { sample } from '../../commands/doctor/services/sample.service';

const message = sample();

process.stdout.write(`${message}\n`);
