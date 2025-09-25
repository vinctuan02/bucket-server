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
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
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
	async create(@Body() dto: CreatePermissionDto) {
		const data = await this.permissionsService.create(dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	async getList(@Query() query: GetListPermissionDto) {
		const data = await this.permissionsService.getList(query);
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const data = await this.permissionsService.findOne(id);
		return new ResponseSuccess({ data });
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
		const data = await this.permissionsService.update(id, dto);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		const data = await this.permissionsService.remove(id);
		return new ResponseSuccess({ data });
	}
}
