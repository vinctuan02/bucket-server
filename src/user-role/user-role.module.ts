import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UserRoleQueryService } from './services/user-role.query.service';
import { UserRoleService } from './services/user-role.service';

@Module({
	imports: [TypeOrmModule.forFeature([UserRole, User, Role])],
	providers: [UserRoleService, UserRoleQueryService],
	exports: [UserRoleService],
})
export class UserRoleModule {}
