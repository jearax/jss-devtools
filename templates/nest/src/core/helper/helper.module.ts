import { Global, Module } from '@nestjs/common';

import { HelperService } from './helper.service.js';

@Global()
@Module({
	providers: [HelperService],
	exports: [HelperService]
})
export class HelperModule {}
