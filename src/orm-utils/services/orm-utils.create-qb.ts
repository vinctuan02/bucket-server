import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permission/entities/permission.entity';
import { Repository } from 'typeorm';
import { Alias } from './orm-utils.alias';

@Injectable()
export class OrmUtilsCreateQb {
	constructor(
		@InjectRepository(Permission)
		private readonly permissionRepo: Repository<Permission>,
	) {}

	createPermissionQb(alias?: string) {
		return this.permissionRepo.createQueryBuilder(
			alias ?? Alias.PERMISSION,
		);
	}
}
