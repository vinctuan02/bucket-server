import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoleModule } from 'src/user-role/user-role.module';
import { User } from './entities/user.entity';
import { UserQueryService } from './services/user.query.service';
import { UsersService } from './services/user.service';
import { UsersController } from './user.controller';

@Module({
	imports: [TypeOrmModule.forFeature([User]), UserRoleModule],
	controllers: [UsersController],
	providers: [UsersService, UserQueryService],
	exports: [UsersService],
})
export class UsersModule {}
