import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import { User } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import type { CurrentUser } from 'src/common/interface/common.interface';
import {
	UpdateFileNodePermissionDto,
	UpsertFileNodePermissionDto,
} from './dto/file-node-permission.dto';
import { FileNodePermissionService } from './file-node-permission.service';

@Controller('file-node/permission')
export class FileNodePermissionController {
	constructor(private readonly service: FileNodePermissionService) {}

	@Post()
	async create(
		@User() currentUser: CurrentUser,
		@Body() dto: UpsertFileNodePermissionDto,
	) {
		const data = await this.service.upsert({ currentUser, dto });
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.service.findOne(id);
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() data: UpdateFileNodePermissionDto) {
		return this.service.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.service.remove(id);
	}

	@Get('/effective/:fileNodeId/:userId')
	getEffective(
		@Param('fileNodeId') fileNodeId: string,
		@Param('userId') userId: string,
	) {
		return this.service.getEffectivePermission(fileNodeId, userId);
	}
}
