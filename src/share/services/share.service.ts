// share.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto, ResponseError } from 'src/common/dto/common.response-dto';
import { generateShareLinkToken } from 'src/common/util/common.util';
import { OrmFilterDto } from 'src/orm-utils/dto/orm-utils.dto';
import { Alias } from 'src/orm-utils/services/orm-utils.alias';
import { OrmUtilsJoin } from 'src/orm-utils/services/orm-utils.join';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { Repository } from 'typeorm';
import {
	CreateShareDto,
	GetListShareDto,
	SharePermissionItemDto,
} from '../dto/share.dto';
import { SharePermission } from '../entities/share-permission.entity';
import { Share } from '../entities/share.entity';
import { ShareType } from '../enum/share.enum';
import { ShareFieldsSimple, SharePermissionsSimple } from '../fm/share.fm';

@Injectable()
export class ShareService {
	constructor(
		@InjectRepository(Share)
		private readonly shareRepo: Repository<Share>,
		@InjectRepository(SharePermission)
		private readonly sharePermissionRepo: Repository<SharePermission>,

		private readonly joinUtils: OrmUtilsJoin,
		private readonly whereUtils: OrmUtilsWhere,
	) {}

	async create({ dto, userId }: { dto: CreateShareDto; userId: string }) {
		const linkToken =
			dto.type === ShareType.LINK ? generateShareLinkToken() : null;

		const share = this.shareRepo.create({
			...dto,
			sharedById: userId,
			linkToken,
		});

		const { id } = await this.shareRepo.save(share);

		if (dto.sharedTo?.length) {
			const permissions = dto.sharedTo.map((item) =>
				this.sharePermissionRepo.create({
					shareId: share.id,
					targetUserId: item.userId,
					...item,
				}),
			);
			await this.sharePermissionRepo.save(permissions);
		}

		return await this.findOne(id);
	}

	async findOne(id: string) {
		const qb = this.shareRepo.createQueryBuilder(Alias.share);
		this.joinUtils.leftJoinShareWithSharePermissions(qb);
		qb.select([...ShareFieldsSimple, ...SharePermissionsSimple]);

		this.whereUtils.andWhereShareId({
			qb,
			shareId: id,
		});

		const entity = await qb.getOne();

		if (!entity) {
			throw new ResponseError({ message: 'Share not found' });
		}

		return entity;
	}

	async getList({ filter }: { filter: GetListShareDto }) {
		const qb = this.shareRepo.createQueryBuilder(Alias.share);
		this.joinUtils.leftJoinShareWithSharePermissions(qb);

		this.whereUtils.applyFilter({
			qb,
			filter: new OrmFilterDto(filter),
		});

		qb.select([...ShareFieldsSimple, ...SharePermissionsSimple]);

		const [items, totalItems] = await qb.getManyAndCount();

		return new PageDto({ items, metadata: { ...filter, totalItems } });
	}

	async revokeShare(id: string) {
		const share = await this.shareRepo.findOne({ where: { id } });
		if (!share) throw new NotFoundException('Share not found');
		share.isRevoked = true;
		await this.shareRepo.save(share);
		return { success: true };
	}

	async addPermission(id: string, body: SharePermissionItemDto) {
		const permission = this.sharePermissionRepo.create({
			shareId: id,
			targetUserId: body.userId,
			...body,
		});
		await this.sharePermissionRepo.save(permission);
	}

	async revokePermission(id: string, userId: string) {
		await this.sharePermissionRepo.delete({
			shareId: id,
			targetUserId: userId,
		});
	}

	async accessByLink(token: string) {
		const share = await this.shareRepo.findOne({
			where: { linkToken: token, isRevoked: false },
			relations: ['permissions'],
		});
		if (!share)
			throw new NotFoundException('Share link invalid or expired');
		if (share.expiresAt && new Date(share.expiresAt) < new Date())
			throw new NotFoundException('Share link expired');
		return share;
	}
}
