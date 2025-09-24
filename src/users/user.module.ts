import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserQueryService } from './services/user.query.service';
import { UsersService } from './services/user.service';
import { UsersController } from './user.controller';

@Module({
	imports: [TypeOrmModule.forFeature([User])],
	controllers: [UsersController],
	providers: [UsersService, UserQueryService],
	exports: [UsersService],
})
export class UsersModule {}
