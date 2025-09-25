import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/common.response-dto';
import { UserRoleService } from 'src/user-role/user-role.service';
import { Repository } from 'typeorm';
import { CreateUserDto, GetListUserDto, UpdateUserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { hashPass } from '../util/user.ulti';
import { UserQueryService } from './user.query.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		private readonly userQueryService: UserQueryService,
		private readonly userRolesService: UserRoleService,
	) {}

	async handleCreate(dto: CreateUserDto) {
		const { userRoles, ...rest } = dto;

		const user = await this.create(rest);
		Promise.all(
			userRoles.map((item) =>
				this.userRolesService.createSafe({
					roleId: item.roleId,
					userId: user.id,
				}),
			),
		);

		return await this.findOneWithPermissions(user.id);
	}

	async create(input: Omit<CreateUserDto, 'userRoles'>): Promise<User> {
		const { password, email } = input;
		await this.userQueryService.ensureEmailNotExists(email);
		input.password = await hashPass(password);
		return await this.userQueryService.create(input);
	}

	async getList(query: GetListUserDto) {
		const { page: currentPage, pageSize } = query;

		const { items, totalItems } =
			await this.userQueryService.getList(query);

		return new PageDto({
			items,
			metadata: { totalItems, pageSize, currentPage },
		});
	}

	async findOne(id: string): Promise<User> {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) throw new NotFoundException(`User ${id} not found`);
		return user;
	}

	async findOneWithPermissions(id: string) {
		const user = await this.userRepo.findOne({
			where: { id },
			relations: {
				userRoles: {
					role: {
						rolePermissions: {
							permission: true,
						},
					},
				},
			},
		});

		if (!user) throw new NotFoundException(`User ${id} not found`);

		return user;
	}

	async findByEmail(email: string) {
		return this.userRepo.findOne({ where: { email } });
	}

	async update(id: string, dto: UpdateUserDto): Promise<User> {
		const user = await this.findOne(id);
		Object.assign(user, dto);
		return this.userRepo.save(user);
	}

	async remove(id: string): Promise<void> {
		await this.userRepo.delete(id);
	}
}
