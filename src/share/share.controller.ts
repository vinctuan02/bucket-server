// share.controller.ts
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
} from '@nestjs/common';
import { GetUserId } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import {
	CreateShareDto,
	GetListShareDto,
	SharePermissionItemDto,
} from './dto/share.dto';
import { ShareService } from './services/share.service';

@Controller('share')
export class ShareController {
	constructor(private readonly shareService: ShareService) {}

	@Post()
	async create(@GetUserId() userId: string, @Body() dto: CreateShareDto) {
		const data = await this.shareService.create({ dto, userId });
		return new ResponseSuccess({ data });
	}

	@Get()
	async getList(@Query() query: GetListShareDto) {
		const data = await this.shareService.getList({ filter: query });
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	async revokeShare(@Param('id') id: string) {
		return this.shareService.revokeShare(id);
	}

	@Post(':id/permissions')
	async addPermission(
		@Param('id') id: string,
		@Body() body: SharePermissionItemDto,
	) {
		return this.shareService.addPermission(id, body);
	}

	@Delete(':id/permissions/:userId')
	async revokePermission(
		@Param('id') id: string,
		@Param('userId') userId: string,
	) {
		return this.shareService.revokePermission(id, userId);
	}

	@Get('link/:token')
	async accessByLink(@Param('token') token: string) {
		return this.shareService.accessByLink(token);
	}
}
