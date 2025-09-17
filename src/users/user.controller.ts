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
import { CreateUserDto, GetListUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './services/user.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	create(@Body() dto: CreateUserDto) {
		return this.usersService.create(dto);
	}

	@Get()
	getList(@Query() query: GetListUserDto) {
		return this.usersService.getList(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.usersService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		return this.usersService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.usersService.remove(id);
	}
}
