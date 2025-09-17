import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/common.response-dto';
import { Repository } from 'typeorm';
import { CreateUserDto, GetListUserDto, UpdateUserDto } from '../dto/user.dto';
import { UserEntity } from '../entities/user.entity';
import { UserQueryService } from './user.query.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly usersRepo: Repository<UserEntity>,

		private readonly userQueryService: UserQueryService,
	) {}

	async create(dto: CreateUserDto): Promise<UserEntity> {
		const user = this.usersRepo.create(dto);
		return this.usersRepo.save(user);
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

	async findOne(id: string): Promise<UserEntity> {
		const user = await this.usersRepo.findOne({ where: { id } });
		if (!user) throw new NotFoundException(`User ${id} not found`);
		return user;
	}

	async findByEmail(email: string) {
		return this.usersRepo.findOne({ where: { email } });
	}

	async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
		const user = await this.findOne(id);
		Object.assign(user, dto);
		return this.usersRepo.save(user);
	}

	async remove(id: string): Promise<void> {
		await this.usersRepo.delete(id);
	}
}
