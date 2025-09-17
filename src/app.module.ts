import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BucketModule } from './bucket/bucket.module';
import { getDatabaseConfig } from './common/config/common.config-db';
import { UsersModule } from './users/user.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getDatabaseConfig,
		}),
		UsersModule,
		BucketModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
