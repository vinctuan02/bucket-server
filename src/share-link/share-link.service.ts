// share-link.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { Repository } from 'typeorm';
import { CreateShareLinkDto } from './dto/share-link.dto';
import { ShareLink } from './entities/share-link.entity';

@Injectable()
export class ShareLinkService {
	constructor(
		@InjectRepository(ShareLink)
		private repo: Repository<ShareLink>,
	) {}

	async create({ userId, dto }: { userId: string; dto: CreateShareLinkDto }) {
		const token = randomBytes(16).toString('hex');
		const link = this.repo.create({ ...dto, createdById: userId, token });
		return await this.repo.save(link);
	}

	async findByToken(token: string) {
		const e = await this.repo.findOne({ where: { token } });
		if (!e) throw new ResponseError({ message: 'Invalid token' });

		return e;
	}

	async delete(id: string) {
		return await this.repo.delete(id);
	}
}
