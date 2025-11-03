// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationModule } from 'src/notification/notification.module';
import { UsersModule } from 'src/users/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthValidateService } from './services/auth.validate.service';
import { GoogleStrategy, JwtStrategy } from './strategy/auth.strategy';

@Module({
	imports: [
		UsersModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret: config.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '30d' },
			}),
		}),
		NotificationModule,
	],
	controllers: [AuthController],
	providers: [AuthService, AuthValidateService, JwtStrategy, GoogleStrategy],
	exports: [AuthService],
})
export class AuthModule {}
