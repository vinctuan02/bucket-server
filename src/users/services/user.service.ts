import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEventType } from 'src/app-event/enum/app-event.enum';
import { PageDto } from 'src/common/dto/common.response-dto';
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
		private readonly eventEmitter: EventEmitter2,
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
		const user = await this.userQueryService.create(input);

		this.eventEmitter.emit(AppEventType.USER_CREATED, user.id);

		return user;
	}

	async activeAccount(id: string): Promise<User> {
		const user = await this.findOne(id);
		user.isActive = true;
		return this.userRepo.save(user);
	}

	async getList(query: GetListUserDto) {
		const { page, pageSize } = query;

		const { items, totalItems } =
			await this.userQueryService.getList(query);

		return new PageDto({
			items,
			metadata: { totalItems, pageSize, page },
		});
	}

	async findOne(id: string): Promise<User> {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) throw new NotFoundException(`User ${id} not found`);
		return user;
	}

	async findOneWithPermissions(id: string) {
		return await this.userQueryService.findOneWithPermissions(id);
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
		await this.eventEmitter.emitAsync(AppEventType.USER_DELETE, id);
		await this.userRepo.delete(id);
	}
}
