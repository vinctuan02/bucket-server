import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permission/entities/permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Alias } from './orm-utils.alias';

@Injectable()
export class OrmUtilsCreateQb {
	constructor(
		@InjectRepository(Permission)
		private readonly permissionRepo: Repository<Permission>,

		@InjectRepository(Role)
		private readonly roleRepo: Repository<Role>,

		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
	) {}

	createPermissionQb(alias?: string) {
		return this.permissionRepo.createQueryBuilder(
			alias ?? Alias.PERMISSION,
		);
	}

	createRoleQb(alias?: string) {
		return this.roleRepo.createQueryBuilder(alias ?? Alias.ROLE);
	}

	createUserQb(alias?: string) {
		return this.userRepo.createQueryBuilder(alias ?? Alias.USER);
	}
}
