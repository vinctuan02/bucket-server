import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { Repository } from 'typeorm';
import { UserStorageResponseError } from './const/user-storage.const';
import { UserStorage } from './entities/user-storage.entity';

@Injectable()
export class UserStorageService {
	constructor(
		@InjectRepository(UserStorage)
		private readonly userStorageRepo: Repository<UserStorage>,
	) {}

	async createDefault({ userId }: { userId: string }) {
		const entity = this.userStorageRepo.create({ userId });
		await this.userStorageRepo.save(entity);
	}

	async getByUserId({ userId }: { userId: string }) {
		return this.userStorageRepo.findOne({
			where: { user: { id: userId } },
		});
	}

	async increaseUsed({ userId, size }: { userId: string; size: number }) {
		await this.userStorageRepo.increment(
			{ user: { id: userId } },
			'used',
			size,
		);
	}

	async decreaseUsed({ userId, size }: { userId: string; size: number }) {
		const storage = await this.userStorageRepo.findOne({
			where: { user: { id: userId } },
			select: ['id', 'used'],
		});

		if (!storage) return;

		const newValue = Math.max(Number(storage.used) - size, 0);

		await this.userStorageRepo.update(storage.id, { used: newValue });
	}

	async addBonus({ userId, size }: { userId: string; size: number }) {
		await this.userStorageRepo.increment(
			{ user: { id: userId } },
			'bonusLimit',
			size,
		);
	}

	async resetBonus({ userId }: { userId: string }) {
		await this.userStorageRepo.update(
			{ user: { id: userId } },
			{ bonusLimit: 0 },
		);
	}

	async validateStorageCapacity({
		userId,
		fileSize,
	}: {
		userId: string;
		fileSize: number;
	}) {
		const storage = await this.findOneByUserId(userId);
		const totalLimit =
			Number(storage.baseLimit) + Number(storage.bonusLimit);
		const used = Number(storage.used);

		if (used + fileSize > totalLimit) {
			throw UserStorageResponseError.STORAGE_LIMIT_EXCEEDED();
		}
	}

	async findOneByUserId(userId: string) {
		const storage = await this.userStorageRepo.findOne({
			where: { userId },
		});

		if (!storage)
			throw new ResponseError(UserStorageResponseError.NOT_FOUND());

		return storage;
	}
}
