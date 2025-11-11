import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharePermission } from '../entities/share-permission.entity';
import { Share } from '../entities/share.entity';

@Injectable()
export class ShareQueryService {
	constructor(
		@InjectRepository(Share)
		private readonly shareRepo: Repository<Share>,
		@InjectRepository(SharePermission)
		private readonly sharePermissionRepo: Repository<SharePermission>,
	) {}
}
