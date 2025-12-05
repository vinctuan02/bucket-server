// src/users/users.controller.ts
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
import { CreateUserDto, GetListUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './services/user.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@RequiredPermissions(APP_PERMISSIONS.CREATE_USER)
	async create(@Body() dto: CreateUserDto) {
		const data = await this.usersService.handleCreate(dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	@RequiredPermissions(APP_PERMISSIONS.READ_USER)
	async getList(@Query() query: GetListUserDto) {
		const data = await this.usersService.getList(query);
		return new ResponseSuccess({ data });
	}

	@Get('simple')
	@RequiredPermissions(APP_PERMISSIONS.READ_USER)
	async getListSimple(@Query() query: GetListUserDto) {
		const data = await this.usersService.getListSimple(query);
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	@RequiredPermissions(APP_PERMISSIONS.READ_USER)
	async findOne(@Param('id') id: string) {
		const data = await this.usersService.findOneWithPermissions(id);
		return new ResponseSuccess({ data });
	}

	@Patch(':id')
	@RequiredPermissions(APP_PERMISSIONS.UPDATE_USER)
	async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		const data = await this.usersService.update(id, dto);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	@RequiredPermissions(APP_PERMISSIONS.DELETE_USER)
	async remove(@Param('id') id: string) {
		const data = await this.usersService.remove(id);
		return new ResponseSuccess({ data });
	}
}
