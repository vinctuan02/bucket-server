// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthValidateService } from './services/auth.validate.service';

@Module({
	imports: [
		UsersModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET || 'changeme',
			signOptions: { expiresIn: '1d' },
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, AuthValidateService],
	exports: [AuthService],
})
export class AuthModule {}
