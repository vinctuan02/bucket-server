// share-link.controller.ts
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GetUserId } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { CreateShareLinkDto } from './dto/share-link.dto';
import { ShareLinkService } from './share-link.service';

@Controller('share-links')
export class ShareLinkController {
	constructor(private readonly service: ShareLinkService) {}

	@Post()
	async create(@GetUserId() userId: string, @Body() dto: CreateShareLinkDto) {
		const data = await this.service.create({ userId, dto });
		return new ResponseSuccess({ data });
	}

	@Get(':token')
	async getByToken(@Param('token') token: string) {
		return await this.service.findByToken(token);
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		return await this.service.delete(id);
	}
}
