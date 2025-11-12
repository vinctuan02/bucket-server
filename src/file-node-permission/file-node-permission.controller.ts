import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import { GetUserId } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
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
		@GetUserId() userId: string,
		@Body() dto: UpsertFileNodePermissionDto,
	) {
		const data = await this.service.upsert({ userId, dto });
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
