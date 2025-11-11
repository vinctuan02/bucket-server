import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
	Strategy as GoogleStrategyBase,
	VerifyCallback,
} from 'passport-google-oauth20';

import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
	constructor(private configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET'),
		});
	}

	async validate(payload: any) {
		return {
			userId: payload.sub,
			username: payload.username,
			roles: payload.roles,
			// permissions: payload.permissions,
		};
	}
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(
	GoogleStrategyBase,
	'google',
) {
	constructor(config: ConfigService) {
		super({
			clientID: config.get('GOOGLE_CLIENT_ID'),
			clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
			callbackURL: config.get('CALLBACK_URL'),
			scope: ['email', 'profile'],
		});
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifyCallback,
	): Promise<any> {
		const { id, name, emails, photos } = profile;
		const user = {
			provider: 'google',
			providerId: id,
			email: emails?.[0]?.value,
			name: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`,
			avatar: photos?.[0]?.value,
			accessToken,
		};
		done(null, user);
	}
}
