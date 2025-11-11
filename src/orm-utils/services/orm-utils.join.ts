import { Injectable } from '@nestjs/common';
import { RolePermissionFM } from 'src/role-permission/constants/role-permission.constant';
import { ShareFm } from 'src/share/fm/share.fm';
import { UserRoleFM } from 'src/user-role/enum/user-role.enum';
import { UserFMR } from 'src/users/enum/user.enum';
import { SelectQueryBuilder } from 'typeorm';
import { RoleFM } from '../../role/constant/orm.role.fm';
import { Alias } from './orm-utils.alias';

@Injectable()
export class OrmUtilsJoin {
	leftJoinUserWithRoles(qb: SelectQueryBuilder<any>) {
		qb.leftJoin(UserFMR.USER_ROLES, Alias.USER_ROLE);
		qb.leftJoin(UserRoleFM.ROLE, Alias.ROLE);
	}

	leftJoinRoleWithPermissions(qb: SelectQueryBuilder<any>) {
		qb.leftJoin(RoleFM.ROLE_PERMISSIONS, Alias.ROLE_PERMISSION);
		qb.leftJoin(RolePermissionFM.PERMISSION, Alias.PERMISSION);
	}

	leftJoinShareWithSharePermissions(qb: SelectQueryBuilder<any>) {
		qb.leftJoin(ShareFm.sharePermissions, Alias.sharePermission);
	}
}
