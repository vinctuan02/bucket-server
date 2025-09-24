import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from './entities/user-role.entity';

@Module({ imports: [TypeOrmModule.forFeature([UserRole])] })
export class UserRoleModule {}
