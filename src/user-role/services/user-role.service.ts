import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/role/entities/role.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class UserRoleService {
	private readonly logger = new Logger(UserRoleService.name);

	constructor(
		@InjectRepository(UserRole)
		private readonly userRoleRepo: Repository<UserRole>,
		@InjectRepository(Role)
		private readonly roleRepo: Repository<UserRole>,
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

	async getUserPermissions(
		userId: string,
	): Promise<{ action: string; resource: string }[]> {
		const userRoles = await this.userRoleRepo
			.createQueryBuilder('ur')
			.leftJoinAndSelect('ur.role', 'role')
			.leftJoinAndSelect('role.rolePermissions', 'rp')
			.leftJoinAndSelect('rp.permission', 'permission')
			.where('ur.userId = :userId', { userId })
			.getMany();

		// Extract unique permissions from all roles
		const permissionsMap = new Map<
			string,
			{ action: string; resource: string }
		>();

		userRoles.forEach((ur) => {
			if (ur.role?.rolePermissions) {
				ur.role.rolePermissions.forEach((rp) => {
					const key = `${rp.permission.action}:${rp.permission.resource}`;
					if (!permissionsMap.has(key)) {
						permissionsMap.set(key, {
							action: rp.permission.action,
							resource: rp.permission.resource,
						});
					}
				});
			}
		});

		return Array.from(permissionsMap.values());
	}
}
