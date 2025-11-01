import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { Permission } from 'src/permission/entities/permission.entity';
import { RolePermission } from 'src/role-permission/entities/role-permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { User } from 'src/users/entities/user.entity';
import { OrmInitService } from './services/orm-init.service';
import { OrmUtilsCreateQb } from './services/orm-utils.create-qb';
import { OrmUtilsJoin } from './services/orm-utils.join';
import { OrmUtilsSelect } from './services/orm-utils.select';
import { OrmUtilsWhere } from './services/orm-utils.where';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Permission,
			Role,
			User,
			UserRole,
			RolePermission,
			FileNode,
		]),
	],
	providers: [
		OrmUtilsCreateQb,
		OrmUtilsJoin,
		OrmUtilsSelect,
		OrmUtilsWhere,
		OrmInitService,
	],
	exports: [OrmUtilsCreateQb, OrmUtilsJoin, OrmUtilsSelect, OrmUtilsWhere],
})
export class OrmUtilsModule {}
