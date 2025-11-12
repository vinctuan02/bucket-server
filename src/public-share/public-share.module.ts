import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { FileNodeModule } from 'src/file-node/file-node.module';
import { ShareLinkModule } from 'src/share-link/share-link.module';
import { PublicShareService } from './public-share.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([FileNode]),
		FileNodeModule,
		ShareLinkModule,
	],

	providers: [PublicShareService],
})
export class PublicShareModule {}
