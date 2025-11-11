import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmUtilsModule } from 'src/orm-utils/orm-utils.module';
import { SharePermission } from './entities/share-permission.entity';
import { Share } from './entities/share.entity';
import { ShareService } from './services/share.service';
import { ShareController } from './share.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([Share, SharePermission]),
		OrmUtilsModule,
	],
	controllers: [ShareController],
	providers: [ShareService],
})
export class ShareModule {}
