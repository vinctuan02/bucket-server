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
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { CreateRoleDto, GetListRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RolesService } from './services/role.service';

@Controller('roles')
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@Post()
	async create(@Body() dto: CreateRoleDto) {
		const data = await this.rolesService.handleCreate(dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	async getList(@Query() query: GetListRoleDto) {
		const data = await this.rolesService.getList(query);
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const data = await this.rolesService.findOneWithPermissions(id);
		return new ResponseSuccess({ data });
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
		const data = await this.rolesService.update(id, dto);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		const data = await this.rolesService.remove(id);
		return new ResponseSuccess({ data });
	}
}
