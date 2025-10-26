import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './entities/role-permission.entity';

@Injectable()
export class RolePermissionService {
	private readonly logger = new Logger(RolePermissionService.name);

	constructor(
		@InjectRepository(RolePermission)
		private readonly rolePermissionRepo: Repository<RolePermission>,
	) {}

	async createSafe(input: { roleId: string; permissionId: string }) {
		return await this.create(input).catch((e) => {
			this.logger.error(e.message);
		});
	}

	async create({
		roleId,
		permissionId,
	}: {
		roleId: string;
		permissionId: string;
	}) {
		const entity = this.rolePermissionRepo.create({ roleId, permissionId });
		return await this.rolePermissionRepo.save(entity);
	}

	async deleteByRoleId(roleId: string) {
		await this.rolePermissionRepo.delete({ roleId });
	}
}
