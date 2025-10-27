import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/common.response-dto';
import { OrmUtilsCreateQb } from 'src/orm-utils/services/orm-utils.create-qb';
import { OrmUtilsJoin } from 'src/orm-utils/services/orm-utils.join';
import { OrmUtilsSelect } from 'src/orm-utils/services/orm-utils.select';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { UserRoleService } from 'src/user-role/services/user-role.service';
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

		private readonly ormUtilsCreateQb: OrmUtilsCreateQb,
		private readonly ormUtilsJoin: OrmUtilsJoin,
		private readonly ormUtilsWhere: OrmUtilsWhere,
		private readonly ormUtilsSelect: OrmUtilsSelect,
	) {}

	async handleCreate(dto: CreateUserDto) {
		const { userRoles, ...rest } = dto;

		const user = await this.create(rest);
		await Promise.all(
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
		input.password = password ? await hashPass(password) : null;
		return await this.userQueryService.create(input);
	}

	async activeAccount(id: string): Promise<User> {
		const user = await this.findOne(id);
		user.isActive = true;
		return this.userRepo.save(user);
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
		const qb = this.ormUtilsCreateQb.createUserQb();
		this.ormUtilsJoin.leftJoinUserWithRoles(qb);
		this.ormUtilsJoin.leftJoinRoleWithPermissions(qb);

		this.ormUtilsSelect.addSelectUserRoleSimple(qb);
		this.ormUtilsSelect.addSelectRoleSimple(qb);
		this.ormUtilsSelect.addSelectRolePermissionSimple(qb);
		this.ormUtilsSelect.addSelectPermissionSimple(qb);

		this.ormUtilsWhere.andWhereUserId({ qb, userId: id });

		const user = await qb.getOne();

		if (!user) throw new NotFoundException(`User ${id} not found`);

		return user;
	}

	async findByEmail(email: string) {
		return this.userRepo.findOne({ where: { email } });
	}

	async update(id: string, dto: UpdateUserDto): Promise<User> {
		const { userRoles, ...rest } = dto;

		rest.password = rest.password
			? await hashPass(rest.password)
			: rest.password;

		const user = await this.findOne(id);
		Object.assign(user, rest);

		await this.userRepo.save(user);
		await this.userRolesService.deleteByUserId(user.id);

		if (userRoles?.length) {
			await Promise.all(
				userRoles.map((item) =>
					this.userRolesService.createSafe({
						roleId: item.roleId,
						userId: user.id,
					}),
				),
			);
		}

		return await this.findOneWithPermissions(user.id);
	}

	async remove(id: string): Promise<void> {
		await this.userRepo.delete(id);
	}
}
