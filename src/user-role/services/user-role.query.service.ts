import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

export class UserRoleQueryService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		@InjectRepository(Role)
		private readonly roleRepo: Repository<Role>,
	) {}

	async validateCreate({
		userId,
		roleId,
	}: {
		userId: string;
		roleId: string;
	}) {
		await Promise.all([
			this.ensureUserExists(userId),
			this.ensurePermissionExists(roleId),
		]);
	}

	async ensureUserExists(id: string) {
		const isExists = await this.userRepo.findOne({ where: { id } });

		if (!isExists) {
			throw new ResponseError({ message: 'User not found' });
		}

		return isExists;
	}

	async ensurePermissionExists(id: string) {
		const isExists = await this.roleRepo.findOne({ where: { id } });

		if (!isExists) {
			throw new ResponseError({ message: 'Roles not found' });
		}
		return isExists;
	}
}
