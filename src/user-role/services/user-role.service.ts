import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class UserRoleService {
	private readonly logger = new Logger(UserRoleService.name);

	constructor(
		@InjectRepository(UserRole)
		private readonly userRoleRepo: Repository<UserRole>,
	) {}

	async createSafe(input: { userId: string; roleId: string }) {
		return await this.create(input).catch((e) => {
			this.logger.error(e.message);
		});
	}

	async create(input: { userId: string; roleId: string }) {
		const entity = this.userRoleRepo.create(input);
		return await this.userRoleRepo.save(entity);
	}

	async deleteByUserId(userId: string) {
		await this.userRoleRepo.delete({ userId });
	}
}
