import { Injectable } from '@nestjs/common';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { UsersService } from 'src/users/services/user.service';
import { comparePass } from 'src/users/util/user.ulti';
import { LoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthValidateService {
	constructor(private readonly userService: UsersService) {}

	async ensureEmailNotExists(email: string): Promise<void> {
		const isExists = await this.userService.findByEmail(email);
		if (isExists) {
			throw new ResponseError({
				message: `Email ${email} already exists`,
			});
		}
	}

	async ensureEmailExists(email: string) {
		const entity = await this.userService.findByEmail(email);
		if (!entity) {
			throw new ResponseError({ message: `Email ${email} not found` });
		}

		return entity;
	}

	async validateLogin({ email, password }: LoginDto) {
		const user = await this.ensureEmailExists(email);
		const isMatch = await comparePass(password, user.password);

		if (!isMatch)
			throw new ResponseError({ message: 'Invalid credentials' });

		return user;
	}
}
