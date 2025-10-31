import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { OrmFilterDto } from 'src/orm-utils/dto/orm-utils.dto';
import { OrmUtilsCreateQb } from 'src/orm-utils/services/orm-utils.create-qb';
import { OrmUtilsJoin } from 'src/orm-utils/services/orm-utils.join';
import { OrmUtilsSelect } from 'src/orm-utils/services/orm-utils.select';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { Repository } from 'typeorm';
import { USER_FIELDS_SIMPLE, UserResponse } from '../constant/user.constant';
import { GetListUserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { ICreateUser } from '../interface/user.interface';

@Injectable()
export class UserQueryService {
	private readonly logger = new Logger(UserQueryService.name);
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		private readonly ormUtilsCreateQb: OrmUtilsCreateQb,
		private readonly ormUtilsJoin: OrmUtilsJoin,
		private readonly ormUtilsWhere: OrmUtilsWhere,
		private readonly ormUtilsSelect: OrmUtilsSelect,
	) {}

	async create(dto: ICreateUser): Promise<User> {
		const user = this.userRepo.create(dto);
		return await this.userRepo.save(user);
	}

	async findOneWithPermissions(id: string) {
		const qb = this.ormUtilsCreateQb.createUserQb();
		this.ormUtilsJoin.leftJoinUserWithRoles(qb);
		this.ormUtilsJoin.leftJoinRoleWithPermissions(qb);

		this.ormUtilsSelect.addSelectUserRoleSimple(qb);
		this.ormUtilsSelect.addSelectRoleSimple(qb);
		this.ormUtilsSelect.addSelectRolePermissionSimple(qb);
		this.ormUtilsSelect.addSelectPermissionSimple(qb);

		this.ormUtilsWhere.andWhereUserId({ qb, userId: id });

		const user = await qb.getOne();

		if (!user) throw new ResponseError({ message: `User ${id} not found` });

		return user;
	}

	async getList(query: GetListUserDto) {
		const { keywords } = query;

		const qb = this.ormUtilsCreateQb.createUserQb();

		this.ormUtilsJoin.leftJoinUserWithRoles(qb);
		this.ormUtilsJoin.leftJoinRoleWithPermissions(qb);

		const ormFilterDto = new OrmFilterDto({
			keywordsUser: keywords,
			...query,
		});

		this.ormUtilsWhere.applyFilter({ qb, filter: ormFilterDto });

		this.ormUtilsSelect.selectUser({ qb, fields: USER_FIELDS_SIMPLE });
		this.ormUtilsSelect.addSelectUserRoleSimple(qb);
		this.ormUtilsSelect.addSelectRoleSimple(qb);
		this.ormUtilsSelect.addSelectRolePermissionSimple(qb);
		this.ormUtilsSelect.addSelectPermissionSimple(qb);

		const [items, totalItems] = await qb.getManyAndCount();
		return { items, totalItems };
	}

	async ensureEmailNotExists(email: string) {
		const exists = await this.userRepo.findOne({ where: { email } });

		if (exists) {
			throw new ResponseError(UserResponse.EMAIL_EXISTS);
		}
	}

	async ensureEmailExists(email: string) {
		const exists = await this.userRepo.findOne({ where: { email } });

		if (!exists) {
			throw new ResponseError(UserResponse.EMAIL_NOT_FOUND);
		}
	}
}
