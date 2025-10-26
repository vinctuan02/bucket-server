import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'src/permission/entities/permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { OrmUtilsCreateQb } from './services/orm-utils.create-qb';
import { OrmUtilsJoin } from './services/orm-utils.join';
import { OrmUtilsSelect } from './services/orm-utils.select';
import { OrmUtilsWhere } from './services/orm-utils.where';

@Module({
	imports: [TypeOrmModule.forFeature([Permission, Role])],
	providers: [OrmUtilsCreateQb, OrmUtilsJoin, OrmUtilsSelect, OrmUtilsWhere],
	exports: [OrmUtilsCreateQb, OrmUtilsJoin, OrmUtilsSelect, OrmUtilsWhere],
})
export class OrmUtilsModule {}
