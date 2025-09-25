// src/permissions/services/permission.query.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PermissionResponse } from '../constants/permission.constant';
import { GetListPermissionDto } from '../dto/permission.dto';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionQueryService {
	constructor(
		@InjectRepository(Permission)
		private readonly permissionRepo: Repository<Permission>,
	) {}

	async create(dto: Partial<Permission>) {
		const entity = this.permissionRepo.create(dto);
		return this.permissionRepo.save(entity);
	}

	async getList(query: GetListPermissionDto) {
		const qb = this.createBaseQuery();
		this.implementFilter(query, qb);

		const [items, totalItems] = await qb.getManyAndCount();
		return { items, totalItems };
	}

	async ensureNotExists(action: string, resource: string) {
		const exists = await this.permissionRepo.findOne({
			where: { action, resource },
		});
		if (exists) throw new ResponseError(PermissionResponse.ALREADY_EXISTS);
	}

	async ensureExists(id: string) {
		const exists = await this.permissionRepo.findOne({ where: { id } });
		if (!exists) throw new ResponseError(PermissionResponse.NOT_FOUND);
		return exists;
	}

	// private
	private createBaseQuery() {
		return this.permissionRepo.createQueryBuilder('permission');
	}

	private implementFilter(
		_query: GetListPermissionDto,
		qb: SelectQueryBuilder<Permission>,
	) {
		// TODO: add filter if needed
		return qb;
	}
}
