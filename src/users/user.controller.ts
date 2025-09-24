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
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { CreateUserDto, GetListUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './services/user.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	async create(@Body() dto: CreateUserDto) {
		const data = await this.usersService.create(dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	async getList(@Query() query: GetListUserDto) {
		const data = await this.usersService.getList(query);
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const data = await this.usersService.findOne(id);
		return new ResponseSuccess({ data });
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		const data = await this.usersService.update(id, dto);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		const data = await this.usersService.remove(id);
		return new ResponseSuccess({ data });
	}
}
