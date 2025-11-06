import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStorage } from './entities/user-storage.entity';
import { UserStorageService } from './user-storage.service';

@Module({
	imports: [TypeOrmModule.forFeature([UserStorage])],
	// controllers: [UserStorageController],
	providers: [UserStorageService],
	exports: [UserStorageService],
})
export class UserStorageModule {}
