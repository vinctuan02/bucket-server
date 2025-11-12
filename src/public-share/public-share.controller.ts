// public-share.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { PublicShareService } from './public-share.service';

@Controller('public-share')
export class PublicShareController {
	constructor(private readonly publicShareService: PublicShareService) {}

	@Get(':token')
	async getShared(@Param('token') token: string) {
		const data = await this.publicShareService.getShared(token);
		return new ResponseSuccess({ data });
	}
}
