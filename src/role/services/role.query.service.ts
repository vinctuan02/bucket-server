// src/roles/services/role.query.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RoleResponse } from '../constant/role.constant';
import { GetListRoleDto } from '../dto/role.dto';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleQueryService {
	constructor(
		@InjectRepository(Role)
		private readonly roleRepo: Repository<Role>,
	) {}

	async create(dto: Partial<Role>) {
		const entity = this.roleRepo.create(dto);
		return this.roleRepo.save(entity);
	}

	async getList(query: GetListRoleDto) {
		const qb = this.createBaseQuery();
		this.implementFilter(query, qb);

		const [items, totalItems] = await qb.getManyAndCount();
		return { items, totalItems };
	}

	async ensureNotExists(name: string) {
		const exists = await this.roleRepo.findOne({ where: { name } });
		if (exists) throw new ResponseError(RoleResponse.ALREADY_EXISTS);
	}

	async ensureExists(id: string) {
		const exists = await this.roleRepo.findOne({ where: { id } });
		if (!exists) throw new ResponseError(RoleResponse.NOT_FOUND);
		return exists;
	}

	// private
	private createBaseQuery() {
		return this.roleRepo.createQueryBuilder('role');
	}

	private implementFilter(
		_query: GetListRoleDto,
		qb: SelectQueryBuilder<Role>,
	) {
		// add conditions if needed
		return qb;
	}
}
