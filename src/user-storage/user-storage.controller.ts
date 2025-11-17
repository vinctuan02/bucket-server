import { Controller, Get, Req } from '@nestjs/common';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { UserStorageService } from './user-storage.service';

@Controller('user-storage')
export class UserStorageController {
	constructor(private readonly userStorageService: UserStorageService) {}

	@Get('me')
	async getMyStorage(@Req() req) {
		const storage = await this.userStorageService.findOneByUserId(
			req.user.userId,
		);

		const baseLimit = Number(storage.baseLimit);
		const bonusLimit = Number(storage.bonusLimit);
		const used = Number(storage.used);
		const totalLimit = baseLimit + bonusLimit;
		const available = totalLimit - used;
		const percentage = Math.round((used / totalLimit) * 100);

		return new ResponseSuccess({
			data: {
				baseLimit,
				bonusLimit,
				totalLimit,
				used,
				available,
				percentage,
			},
		});
	}
}
