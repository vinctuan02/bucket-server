import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEventModule } from './app-event/app-event.module';
import { AppInitService } from './app-init.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard, PermissionsGuard } from './auth/guard/auth.guard';
import { BucketModule } from './bucket/bucket.module';
import { getDatabaseConfig } from './common/config/common.config-db';
import { validationSchema } from './common/config/common.validate-env';
import { TestController } from './common/controllers/test.controller';
import { FileNodePermissionModule } from './file-node-permission/file-node-permission.module';
import { FileNodeModule } from './file-node/file-node.module';
import { NotificationModule } from './notification/notification.module';
import { PermissionModule } from './permission/permission.module';
import { PublicShareModule } from './public-share/public-share.module';
import { RolePermissionModule } from './role-permission/role-permission.module';
import { RoleModule } from './role/role.module';
import { ShareLinkModule } from './share-link/share-link.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { UserRoleModule } from './user-role/user-role.module';
import { UserStorageModule } from './user-storage/user-storage.module';
import { UsersModule } from './users/user.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getDatabaseConfig,
		}),
		AppEventModule,

		NotificationModule,
		UsersModule,
		AuthModule,
		BucketModule,

		RoleModule,
		PermissionModule,
		UserRoleModule,
		RolePermissionModule,

		PublicShareModule,
		ShareLinkModule,
		SubscriptionModule,
		FileNodePermissionModule,
		FileNodeModule,
		UserStorageModule,
	],
	controllers: [AppController, TestController],
	providers: [
		AppService,
		AppInitService,
		PermissionsGuard,
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		{
			provide: APP_GUARD,
			useClass: PermissionsGuard,
		},
	],
})
export class AppModule {}
