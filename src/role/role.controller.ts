// src/roles/roles.controller.ts
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
import { APP_PERMISSIONS } from 'src/permission/constants/permission.constant';
import { CreateRoleDto, GetListRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RolesService } from './services/role.service';

@Controller('roles')
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@Post()
	@RequiredPermissions(APP_PERMISSIONS.CREATE_ROLE)
	async create(@Body() dto: CreateRoleDto) {
		const data = await this.rolesService.handleCreate(dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	@RequiredPermissions(APP_PERMISSIONS.READ_ROLE)
	async getList(@Query() query: GetListRoleDto) {
		const data = await this.rolesService.getList(query);
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	@RequiredPermissions(APP_PERMISSIONS.READ_ROLE)
	async findOne(@Param('id') id: string) {
		const data = await this.rolesService.findOneWithPermissions(id);
		return new ResponseSuccess({ data });
	}

	@Patch(':id')
	@RequiredPermissions(APP_PERMISSIONS.UPDATE_ROLE)
	async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
		const data = await this.rolesService.update(id, dto);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	@RequiredPermissions(APP_PERMISSIONS.DELETE_ROLE)
	async remove(@Param('id') id: string) {
		const data = await this.rolesService.remove(id);
		return new ResponseSuccess({ data });
	}
}
