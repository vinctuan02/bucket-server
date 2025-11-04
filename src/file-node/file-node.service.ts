// src/modules/file-manager/file-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import type { Request } from 'express';
import { UploadPurpose } from 'src/bucket/enum/bucket.enum';
import { BucketService } from 'src/bucket/services/bucket.service';
import { PageDto, ResponseError } from 'src/common/dto/common.response-dto';
import { getUserIdFromReq } from 'src/common/util/common.util';
import { OrmFilterDto } from 'src/orm-utils/dto/orm-utils.dto';
import { OrmUtilsCreateQb } from 'src/orm-utils/services/orm-utils.create-qb';
import { OrmUtilsSelect } from 'src/orm-utils/services/orm-utils.select';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { LessThanOrEqual, TreeRepository } from 'typeorm';
import {
	CreateFileDto,
	CreateFolderDto,
	GetlistFileNodeDto,
} from './dto/file-node.dto';
import { FileNode } from './entities/file-node.entity';
import { TYPE_FILE_NODE } from './enum/file-node.enum';

@Injectable()
export class FileManagerService {
	private readonly logger = new Logger(FileManagerService.name);

	constructor(
		@InjectRepository(FileNode)
		private readonly fileNodeRepo: TreeRepository<FileNode>,

		private readonly configService: ConfigService,

		private readonly bucketSv: BucketService,

		private readonly createQbUtils: OrmUtilsCreateQb,
		private readonly whereUtils: OrmUtilsWhere,
		private readonly selectUtils: OrmUtilsSelect,
	) {}

	// create
	async createFolder({ req, dto }: { req: Request; dto: CreateFolderDto }) {
		const { fileNodeParentId, name } = dto;
		const userId = getUserIdFromReq(req);

		const parent = await this.validateAndGetParent(fileNodeParentId);
		if (fileNodeParentId) {
			await this.validateUniqueConstraint({
				fileNodeParentId,
				name,
				type: TYPE_FILE_NODE.FOLDER,
			});
		}

		const folder = this.createFileNode({
			name,
			type: TYPE_FILE_NODE.FOLDER,
			ownerId: userId,
			parent,
		});

		return this.fileNodeRepo.save(folder);
	}

	async createRootFolder(userId: string) {
		const folder = this.createFileNode({
			id: userId,
			name: userId,
			type: TYPE_FILE_NODE.FOLDER,
			ownerId: userId,
		});

		return this.fileNodeRepo.save(folder);
	}

	async createFile(dto: CreateFileDto) {
		const { name, fileNodeParentId, fileMetadata } = dto;

		const parent = await this.validateAndGetParent(fileNodeParentId);
		if (fileNodeParentId) {
			await this.validateUniqueConstraint({
				fileNodeParentId,
				name,
				type: TYPE_FILE_NODE.FOLDER,
			});
		}
		const fileBucketDb = await this.bucketSv.getUploadUrl({
			...fileMetadata,
			folderBucket: { uploadPurpose: UploadPurpose.CASE_1 },
		});

		const entity = this.createFileNode({
			name,
			type: TYPE_FILE_NODE.FOLDER,
			parent,
		});

		const saved = await this.fileNodeRepo.save(entity);
		return { ...saved, uploadUrl: fileBucketDb.uploadUrl };
	}

	// read
	async findOne(id: string) {
		const entity = await this.fileNodeRepo.findOne({ where: { id } });

		if (!entity) {
			throw new ResponseError({ message: 'File node not found' });
		}

		return entity;
	}

	async findOneWithChildren(id: string) {
		const entity = await this.fileNodeRepo.findOne({
			where: { id },
			relations: { fileNodeChildrens: true },
		});

		if (!entity) {
			throw new ResponseError({ message: 'File node not found' });
		}

		return entity;
	}

	async findOneFullTree(id: string): Promise<FileNode | null> {
		const node = await this.findOne(id);
		return await this.fileNodeRepo.findDescendantsTree(node);
	}

	async getList({
		req,
		filter,
	}: {
		req: Request;
		filter: GetlistFileNodeDto;
	}) {
		const { fileNodeParentId, keywords } = filter;
		const qb = this.createQbUtils.createFileNodeQb();
		const filterOrm = new OrmFilterDto({
			fileNodeParentId,
			keywordsFileNode: keywords,
			...filter,
		});

		this.whereUtils.applyFilter({ qb, filter: filterOrm });

		const [items, totalItems] = await qb.getManyAndCount();
		return new PageDto({ items, metadata: { ...filter, totalItems } });
	}

	async createRootIfNotExists(userId: string) {
		try {
			await this.findOne(userId);
		} catch (error) {
			await this.createRootFolder(userId);
		}
	}

	async getHome({
		req,
		filter,
	}: {
		req: Request;
		filter: GetlistFileNodeDto;
	}) {
		const userId = getUserIdFromReq(req);

		await this.createRootIfNotExists(userId);

		const qb = this.createQbUtils.createFileNodeQb();
		const filterOrm = new OrmFilterDto({
			fileNodeParentId: userId,
		});

		this.whereUtils.applyFilter({ qb, filter: filterOrm });

		const [items, totalItems] = await qb.getManyAndCount();
		return new PageDto({ items, metadata: { ...filter, totalItems } });
	}

	async getListWithChildrens({
		req,
		filter,
	}: {
		req: Request;
		filter: GetlistFileNodeDto;
	}) {
		const { fileNodeParentId } = filter;
		const qb = this.createQbUtils.createFileNodeQb();
		const filterOrm = new OrmFilterDto({ fileNodeParentId });
		this.whereUtils.applyFilter({ qb, filter: filterOrm });
		const [items, totalItems] = await qb.getManyAndCount();
		const result = await Promise.all(
			items.map(async (item) => {
				return this.fileNodeRepo.findDescendantsTree(item);
			}),
		);
		return new PageDto({
			items: result,
			metadata: { ...filter, totalItems },
		});
	}

	async getListFullTree({
		req,
		filter,
	}: {
		req: Request;
		filter: GetlistFileNodeDto;
	}) {
		const roots = await this.fileNodeRepo.findRoots();
		const trees = await Promise.all(
			roots.map(async (root) => {
				return this.fileNodeRepo.findDescendantsTree(root);
			}),
		);
		return new PageDto({
			items: trees,
			metadata: { ...filter, totalItems: trees.length },
		});
	}

	async moveToTrash(id: string) {
		const entity = await this.findOneWithChildren(id);

		const now = new Date();
		await this.fileNodeRepo.update(id, { deletedAt: now, isDelete: true });

		if (entity.fileNodeChildrens?.length) {
			await Promise.all(
				entity.fileNodeChildrens.map((child) =>
					this.moveToTrash(child.id),
				),
			);
		}
	}

	async deletePermanent(id: string) {
		const entity = await this.findOneWithChildren(id);
		const { fileNodeChildrens } = entity;

		if (fileNodeChildrens.length) {
			await Promise.all(
				fileNodeChildrens.map((child) =>
					this.deletePermanent(child.id),
				),
			);
		}

		if (entity.type === TYPE_FILE_NODE.FILE && entity.fileBucketId) {
			await this.bucketSv.deleteSafe(entity.fileBucketId);
		}

		await this.fileNodeRepo.delete(entity.id);
	}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async handleCron() {
		const days = this.configService.get<number>('TRASH_EXPIRE_DAYS', 30);
		const limitDate = dayjs().subtract(days, 'day').toDate();

		const oldFiles = await this.fileNodeRepo.find({
			where: { deletedAt: LessThanOrEqual(limitDate) },
		});

		for (const file of oldFiles) {
			try {
				await this.deletePermanent(file.id);
			} catch (e) {
				this.logger.error(`Delete failed for ${file.id}`, e);
			}
		}
	}

	// private
	private async isFolder(parentId: string) {
		const entity = await this.findOne(parentId);
		if (entity.type !== TYPE_FILE_NODE.FOLDER) {
			throw new ResponseError({ message: 'Invalid parentId' });
		}
	}

	private async validateUniqueConstraint(input: {
		fileNodeParentId: string;
		name: string;
		type: TYPE_FILE_NODE;
	}) {
		const isExists = await this.fileNodeRepo.findOne({ where: input });

		if (isExists) {
			throw new ResponseError({
				message: `A ${input.type.toLowerCase()} name "${input.name}" already exists in this folder.`,
			});
		}
	}

	private async validateAndGetParent(
		fileNodeParentId?: string,
	): Promise<FileNode | null> {
		if (!fileNodeParentId) return null;

		const parent = await this.findOne(fileNodeParentId);
		await this.isFolder(fileNodeParentId);
		return parent;
	}

	private createFileNode(data: {
		id?: string;
		name: string;
		type: TYPE_FILE_NODE;
		ownerId?: string;
		parent?: FileNode | null;
		fileBucketId?: string;
	}): FileNode {
		return this.fileNodeRepo.create({
			id: data.id,
			name: data.name,
			type: data.type,
			ownerId: data.ownerId,
			fileNodeParent: data.parent || null,
			fileBucketId: data.fileBucketId || null,
		});
	}
}
