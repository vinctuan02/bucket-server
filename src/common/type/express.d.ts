import { CurrentUser } from '../interface/common.interface';

declare module 'express-serve-static-core' {
	interface Request {
		user?: CurrentUser;
	}
}
