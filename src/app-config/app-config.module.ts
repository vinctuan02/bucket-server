import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BucketModule } from 'src/bucket/bucket.module';
import { AppConfigController } from './app-config.controller';
import { AppConfig } from './app-config.entity';
import { AppConfigService } from './services/app-config.service';

@Module({
	imports: [TypeOrmModule.forFeature([AppConfig]), BucketModule],
	controllers: [AppConfigController],
	providers: [AppConfigService],
	exports: [AppConfigService],
})
export class AppConfigModule {}
