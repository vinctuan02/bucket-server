import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Share } from './entities/share.entity';

@Module({ imports: [TypeOrmModule.forFeature([Share])] })
export class ShareModule {}
