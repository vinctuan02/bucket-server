import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SelectQueryBuilder } from 'typeorm/browser';
import { GetListUserDto } from '../dto/user.dto';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserQueryService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepo: Repository<UserEntity>,
	) {}

	private createBaseQuery() {
		return this.userRepo.createQueryBuilder('user');
	}

	private implementFilter(
		query: GetListUserDto,
		qb: SelectQueryBuilder<UserEntity>,
	) {
		return qb;
	}

	async getList(query: GetListUserDto) {
		const qb = this.createBaseQuery();
		this.implementFilter(query, qb);
		const [items, totalItems] = await qb.getManyAndCount();
		return { items, totalItems };
	}
}
