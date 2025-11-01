// src/permissions/services/permission.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/common.response-dto';
import { Repository } from 'typeorm';
import {
	CreatePermissionDto,
	GetListPermissionDto,
	UpdatePermissionDto,
} from '../dto/permission.dto';
import { Permission } from '../entities/permission.entity';
import { PermissionQueryService } from './permission.query.service';

@Injectable()
export class PermissionsService {
	constructor(
		@InjectRepository(Permission)
		private readonly permissionRepo: Repository<Permission>,
		private readonly permissionQueryService: PermissionQueryService,
	) {}

	async create(dto: CreatePermissionDto) {
		await this.permissionQueryService.ensureNotExists(
			dto.action,
			dto.resource,
		);
		return this.permissionQueryService.create(dto);
	}

	async getList(query: GetListPermissionDto) {
		const { page, pageSize } = query;
		const { items, totalItems } =
			await this.permissionQueryService.getList(query);

		return new PageDto({
			items,
			metadata: { totalItems, pageSize, page },
		});
	}

	async findOne(id: string) {
		const entity = await this.permissionRepo.findOne({ where: { id } });
		if (!entity) throw new NotFoundException(`Permission ${id} not found`);
		return entity;
	}

	async update(id: string, dto: UpdatePermissionDto) {
		const entity = await this.findOne(id);
		Object.assign(entity, dto);
		return this.permissionRepo.save(entity);
	}

	async remove(id: string) {
		await this.permissionRepo.delete(id);
	}
}
