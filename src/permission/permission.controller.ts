// src/permissions/permissions.controller.ts
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { RequiredPermissions } from 'src/auth/decorator/auth.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { APP_PERMISSIONS } from './constants/permission.constant';
import {
	CreatePermissionDto,
	GetListPermissionDto,
	UpdatePermissionDto,
} from './dto/permission.dto';
import { PermissionsService } from './services/permission.service';

@Controller('permissions')
export class PermissionsController {
	constructor(private readonly permissionsService: PermissionsService) {}

	@Post()
	@RequiredPermissions(APP_PERMISSIONS.CREATE_PERMISSION)
	async create(@Body() dto: CreatePermissionDto) {
		const data = await this.permissionsService.create(dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	@RequiredPermissions(APP_PERMISSIONS.READ_PERMISSION)
	async getList(@Query() query: GetListPermissionDto) {
		const data = await this.permissionsService.getList(query);
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	@RequiredPermissions(APP_PERMISSIONS.READ_PERMISSION)
	async findOne(@Param('id') id: string) {
		const data = await this.permissionsService.findOne(id);
		return new ResponseSuccess({ data });
	}

	@Patch(':id')
	@RequiredPermissions(APP_PERMISSIONS.UPDATE_PERMISSION)
	async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
		const data = await this.permissionsService.update(id, dto);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	@RequiredPermissions(APP_PERMISSIONS.DELETE_PERMISSION)
	async remove(@Param('id') id: string) {
		const data = await this.permissionsService.remove(id);
		return new ResponseSuccess({ data });
	}
}
