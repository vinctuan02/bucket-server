// src/permissions/services/permission.query.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { OrmFilterDto } from 'src/orm-utils/dto/orm-utils.dto';
import { OrmUtilsCreateQb } from 'src/orm-utils/services/orm-utils.create-qb';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { Repository } from 'typeorm';
import { PermissionResponse } from '../constants/permission.constant';
import { GetListPermissionDto } from '../dto/permission.dto';
import { Permission } from '../entities/permission.entity';
import { PermissionAction } from '../enums/permission.enum';

@Injectable()
export class PermissionQueryService {
	constructor(
		@InjectRepository(Permission)
		private readonly permissionRepo: Repository<Permission>,

		private readonly ormUtilsCreateQb: OrmUtilsCreateQb,
		private readonly ormUtilsWhere: OrmUtilsWhere,
	) {}

	async create(dto: Partial<Permission>) {
		const entity = this.permissionRepo.create(dto);
		return this.permissionRepo.save(entity);
	}

	async getList(query: GetListPermissionDto) {
		const { keywords, page, pageSize } = query;

		const qb = this.ormUtilsCreateQb.createPermissionQb();

		const ormFilter = new OrmFilterDto({
			keywordsPermission: keywords,
			...query,
		});

		this.ormUtilsWhere.applyFilter({ qb, filter: ormFilter });

		const [items, totalItems] = await qb.getManyAndCount();
		return { items, totalItems };
	}

	async ensureNotExists(action: PermissionAction, resource: string) {
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
}
