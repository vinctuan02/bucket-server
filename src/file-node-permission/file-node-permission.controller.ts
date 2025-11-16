import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import type { CurrentUser } from 'src/common/interface/common.interface';
import {
	UpdateFileNodePermissionDto,
	UpsertFileNodePermissionDto,
} from './dto/file-node-permission.dto';
import { FileNodePermissionService } from './file-node-permission.service';

@ApiTags('File Node - Permissions')
@ApiBearerAuth()
@Controller('file-node/permission')
export class FileNodePermissionController {
	constructor(private readonly service: FileNodePermissionService) {}

	@Post()
	@ApiOperation({ summary: 'Create or update file/folder permission' })
	@ApiBody({ type: UpsertFileNodePermissionDto })
	@ApiResponse({
		status: 201,
		description: 'Permission created/updated successfully',
	})
	async create(
		@User() currentUser: CurrentUser,
		@Body() dto: UpsertFileNodePermissionDto,
	) {
		const data = await this.service.upsert({ currentUser, dto });
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get permission by ID' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Permission ID (UUID)',
	})
	@ApiResponse({ status: 200, description: 'Permission details' })
	findOne(@Param('id') id: string) {
		return this.service.findOne(id);
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update permission' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Permission ID (UUID)',
	})
	@ApiBody({ type: UpdateFileNodePermissionDto })
	@ApiResponse({
		status: 200,
		description: 'Permission updated successfully',
	})
	update(@Param('id') id: string, @Body() data: UpdateFileNodePermissionDto) {
		return this.service.update(id, data);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete permission' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Permission ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'Permission deleted successfully',
	})
	remove(@Param('id') id: string) {
		return this.service.remove(id);
	}

	@Get('/effective/:fileNodeId/:userId')
	@ApiOperation({
		summary: 'Get effective permission for user on file/folder',
	})
	@ApiParam({
		name: 'fileNodeId',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiParam({ name: 'userId', type: 'string', description: 'User ID (UUID)' })
	@ApiResponse({ status: 200, description: 'Effective permission details' })
	getEffective(
		@Param('fileNodeId') fileNodeId: string,
		@Param('userId') userId: string,
	) {
		return this.service.getEffectivePermission(fileNodeId, userId);
	}
}
