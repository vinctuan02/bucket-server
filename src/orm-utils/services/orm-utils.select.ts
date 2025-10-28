import { Injectable } from '@nestjs/common';
import { PermissionFieldsSimple } from 'src/permission/constants/permission.constant';
import { RolePermissionFieldsSimple } from 'src/role-permission/constants/role-permission.constant';
import { RoleFieldSimple } from 'src/role/constant/role.constant';
import { UserRoleSimple } from 'src/user-role/constants/user-role.constant';
import { UserFilesAll } from 'src/users/constant/user.constant';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class OrmUtilsSelect {
	addSelectUser({
		qb,
		fields,
	}: {
		qb: SelectQueryBuilder<any>;
		fields?: string[];
	}) {
		qb.addSelect(fields ?? UserFilesAll);
	}

	addSelectUserRoleSimple(qb: SelectQueryBuilder<any>) {
		qb.addSelect(UserRoleSimple);
	}

	addSelectRoleSimple(qb: SelectQueryBuilder<any>) {
		qb.addSelect(RoleFieldSimple);
	}

	addSelectRolePermissionSimple(qb: SelectQueryBuilder<any>) {
		qb.addSelect(RolePermissionFieldsSimple);
	}

	addSelectPermissionSimple(qb: SelectQueryBuilder<any>) {
		qb.addSelect(PermissionFieldsSimple);
	}
}
