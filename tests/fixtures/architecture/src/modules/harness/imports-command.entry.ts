import { sample } from '../../commands/doctor/sample.service';

const message = sample();

process.stdout.write(`${message}\n`);
