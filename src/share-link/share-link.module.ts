// share-link.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareLink } from './entities/share-link.entity';
import { ShareLinkController } from './share-link.controller';
import { ShareLinkService } from './share-link.service';

@Module({
	imports: [TypeOrmModule.forFeature([ShareLink])],
	controllers: [ShareLinkController],
	providers: [ShareLinkService],
	exports: [ShareLinkService],
})
export class ShareLinkModule {}
