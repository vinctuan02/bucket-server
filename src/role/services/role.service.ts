// src/roles/services/role.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/common.response-dto';
import { RolePermissionService } from 'src/role-permission/role-permission.service';
import { Repository } from 'typeorm';
import { CreateRoleDto, GetListRoleDto, UpdateRoleDto } from '../dto/role.dto';
import { Role } from '../entities/role.entity';
import { RoleQueryService } from './role.query.service';

@Injectable()
export class RolesService {
	constructor(
		@InjectRepository(Role)
		private readonly roleRepo: Repository<Role>,
		private readonly roleQueryService: RoleQueryService,

		private readonly rolePermissionService: RolePermissionService,
	) {}

	async handleCreate(input: CreateRoleDto) {
		const { rolePermissions, ...rest } = input;
		const role = await this.create(rest);

		await Promise.all(
			rolePermissions.map((item) =>
				this.rolePermissionService.createSafe({
					permissionId: item.permissionId,
					roleId: role.id,
				}),
			),
		);

		return await this.findOneWithPermissions(role.id);
	}

	private async create(input: Omit<CreateRoleDto, 'rolePermissions'>) {
		await this.roleQueryService.ensureNotExists(input.name);
		return this.roleQueryService.create(input);
	}

	async getList(query: GetListRoleDto) {
		const { page: currentPage, pageSize } = query;
		const { items, totalItems } =
			await this.roleQueryService.getList(query);

		return new PageDto({
			items,
			metadata: { totalItems, pageSize, currentPage },
		});
	}

	async findOne(id: string) {
		const entity = await this.roleRepo.findOne({ where: { id } });
		if (!entity) throw new NotFoundException(`Role ${id} not found`);
		return entity;
	}

	async findOneWithPermissions(id: string) {
		return this.roleRepo.findOne({
			where: { id },
			relations: {
				rolePermissions: {
					permission: true,
				},
			},
		});
	}

	async update(id: string, dto: UpdateRoleDto) {
		const entity = await this.findOne(id);
		Object.assign(entity, dto);
		return this.roleRepo.save(entity);
	}

	async remove(id: string) {
		await this.roleRepo.delete(id);
	}
}
