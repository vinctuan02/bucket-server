// src/modules/file-manager/file-manager.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { UploadPurpose } from 'src/bucket/enum/bucket.enum';
import { BucketService } from 'src/bucket/services/bucket.service';
import { PageDto, ResponseError } from 'src/common/dto/common.response-dto';
import { getUserIdFromReq } from 'src/common/util/common.util';
import { OrmFilterDto } from 'src/orm-utils/dto/orm-utils.dto';
import { OrmUtilsCreateQb } from 'src/orm-utils/services/orm-utils.create-qb';
import { OrmUtilsSelect } from 'src/orm-utils/services/orm-utils.select';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { Repository } from 'typeorm';
import {
	CreateFileDto,
	CreateFolderDto,
	GetlistFileNodeDto,
} from './dto/file-node.dto';
import { FileNode } from './entities/file-node.entity';
import { TYPE_FILE_NODE } from './enum/file-node.enum';

@Injectable()
export class FileManagerService {
	constructor(
		@InjectRepository(FileNode)
		private readonly fileNodeRepo: Repository<FileNode>,

		private readonly bucketSv: BucketService,

		private readonly createQbUtils: OrmUtilsCreateQb,
		private readonly whereUtils: OrmUtilsWhere,
		private readonly selectUtils: OrmUtilsSelect,
	) {}

	// folder
	async createFolder({ req, dto }: { req: Request; dto: CreateFolderDto }) {
		const { fileNodeParentId, name } = dto;
		const userId = getUserIdFromReq(req);
		if (fileNodeParentId) {
			await this.isFolder(fileNodeParentId);
		}

		const folder = this.fileNodeRepo.create({
			name,
			type: TYPE_FILE_NODE.FOLDER,
			fileNodeParentId,
			ownerId: userId,
		});

		return this.fileNodeRepo.save(folder);
	}

	// // file
	async createFile(dto: CreateFileDto) {
		const { name, fileNodeParentId, fileMetadata } = dto;

		if (fileNodeParentId) {
			await this.isFolder(fileNodeParentId);
		}

		const fileBucketDb = await this.bucketSv.getUploadUrl({
			...fileMetadata,
			bucket: 'test',
			folderBucket: { uploadPurpose: UploadPurpose.CASE_1 },
		});

		const fileNode = this.fileNodeRepo.create({
			name,
			type: TYPE_FILE_NODE.FILE,
			fileNodeParentId,
			fileBucketId: fileBucketDb.id,
		});

		return { ...fileNode, uploadUrl: fileBucketDb.uploadUrl };
	}

	async findOne(id: string) {
		const entity = await this.fileNodeRepo.findOne({ where: { id } });

		if (!entity) {
			throw new ResponseError({ message: 'File node not found' });
		}

		return entity;
	}

	async getList({
		req,
		filter,
	}: {
		req: Request;
		filter: GetlistFileNodeDto;
	}) {
		const { fileNodeParentId, page, pageSize } = filter;

		const qb = this.createQbUtils.createFileNodeQb();
		const filterOrm = new OrmFilterDto({
			fileNodeParentId,
		});

		this.whereUtils.applyFilter({ qb, filter: filterOrm });

		const [items, totalItems] = await qb.getManyAndCount();

		return new PageDto({
			items,
			metadata: { totalItems, currentPage: page, pageSize },
		});
	}

	private async isFolder(parentId: string) {
		const entity = await this.findOne(parentId);
		if (entity.type !== TYPE_FILE_NODE.FOLDER) {
			throw new ResponseError({ message: 'Invalid parentId' });
		}
	}
}
