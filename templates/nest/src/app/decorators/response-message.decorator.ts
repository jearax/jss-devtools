import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'app:response-message';

/** The i18n key of a handler's success message, in place of the `http.<status>` default. */
export const ResponseMessage = (key: string): MethodDecorator & ClassDecorator => {
	return SetMetadata(RESPONSE_MESSAGE_KEY, key);
};
