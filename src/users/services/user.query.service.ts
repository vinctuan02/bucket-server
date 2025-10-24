import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { Repository } from 'typeorm';
import { SelectQueryBuilder } from 'typeorm/browser';
import { UserResponse } from '../constant/user.constant';
import { GetListUserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { ICreateUser } from '../interface/user.interface';
import { hashPass } from '../util/user.ulti';

@Injectable()
export class UserQueryService implements OnModuleInit {
	private readonly logger = new Logger(UserQueryService.name);
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		private readonly configService: ConfigService,
	) {}

	async onModuleInit() {
		try {
			await this.initUser();
		} catch (error) {
			this.logger.error('Error initializing database:', error);
		}
	}

	async create(dto: ICreateUser): Promise<User> {
		const user = this.userRepo.create(dto);
		return await this.userRepo.save(user);
	}

	async getList(query: GetListUserDto) {
		const qb = this.createBaseQuery();
		this.implementFilter(query, qb);
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

	// private
	private createBaseQuery() {
		return this.userRepo.createQueryBuilder('user');
	}

	private implementFilter(
		query: GetListUserDto,
		qb: SelectQueryBuilder<User>,
	) {
		return qb;
	}

	private async initUser() {
		const count = await this.userRepo.count();

		if (count === 0) {
			this.logger.log('Init user');

			const password = await hashPass(
				this.configService.get<string>('DEFAULT_PASS')!,
			);

			const entity = this.userRepo.create({
				id: this.configService.get<string>('DEFAULT_USER_ID'),
				name: this.configService.get<string>('DEFAULT_NAME'),
				password,
				isActive: this.configService.get<boolean>('DEFAULT_IS_ACTIVE'),
				email: this.configService.get<string>('DEFAULT_EMAIL'),
			});

			return this.create(entity);
		}

		this.logger.log('Skip init user');
	}
}
