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
import { User } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import type { CurrentUser } from 'src/common/interface/common.interface';
import { APP_PERMISSIONS } from 'src/permission/constants/permission.constant';
import { UpdateProfileDto } from './dto/update-profile.dto';
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

	@Get('profile/me')
	@RequiredPermissions(APP_PERMISSIONS.READ_PROFILE)
	async getProfile(@User() currentUser: CurrentUser) {
		const data = await this.usersService.findOne(currentUser.userId);
		return new ResponseSuccess({ data });
	}

	@Patch('profile/me')
	@RequiredPermissions(APP_PERMISSIONS.UPDATE_PROFILE)
	async updateProfile(
		@User() currentUser: CurrentUser,
		@Body() dto: UpdateProfileDto,
	) {
		const data = await this.usersService.updateProfile(
			currentUser.userId,
			dto,
		);
		return new ResponseSuccess({ data });
	}

	@Post('profile/avatar-upload-url')
	@RequiredPermissions(APP_PERMISSIONS.UPDATE_PROFILE)
	async getAvatarUploadUrl(
		@Body()
		fileMetadata: {
			fileName: string;
			fileSize: number;
			contentType: string;
		},
	) {
		const data = await this.usersService.getAvatarUploadUrl(fileMetadata);
		return new ResponseSuccess({ data });
	}
}
