import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/services/user.service';
import { comparePass } from 'src/users/util/user.ulti';
import { AuthResponseError } from '../constant/auth.const';
import { LoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthValidateService {
	constructor(private readonly userService: UsersService) {}

	async ensureEmailNotExists(email: string): Promise<void> {
		const isExists = await this.userService.findByEmail(email);
		if (isExists) {
			throw AuthResponseError.EMAIL_ALREADY_EXISTS(email);
		}
	}

	async ensureEmailExists(email: string) {
		const entity = await this.userService.findByEmail(email);
		if (!entity) {
			throw AuthResponseError.EMAIL_NOT_FOUND(email);
		}

		return entity;
	}

	async validateLogin({ email, password }: LoginDto) {
		const user = await this.ensureEmailExists(email);
		const isMatch = await comparePass(password, user?.password ?? '');

		if (!isMatch) throw AuthResponseError.INVALID_CREDENTIALS();

		return await this.userService.findOneWithPermissions(user.id);
	}
}
