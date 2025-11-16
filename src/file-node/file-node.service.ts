// src/modules/file-manager/file-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import type { Request } from 'express';
import { UploadPurpose } from 'src/bucket/enum/bucket.enum';
import { BucketService } from 'src/bucket/services/bucket.service';
import { PageDto } from 'src/common/dto/common.response-dto';
import { CurrentUser } from 'src/common/interface/common.interface';
import { parseReq } from 'src/common/util/common.util';
import { UpsertFileNodePermissionDto } from 'src/file-node-permission/dto/file-node-permission.dto';
import { FileNodePermission } from 'src/file-node-permission/entities/file-node-permission.entity';
import { FileNodePermissionService } from 'src/file-node-permission/file-node-permission.service';
import { OrmFilterDto } from 'src/orm-utils/dto/orm-utils.dto';
import { OrmUtilsCreateQb } from 'src/orm-utils/services/orm-utils.create-qb';
import { OrmUtilsSelect } from 'src/orm-utils/services/orm-utils.select';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { UserStorageService } from 'src/user-storage/user-storage.service';
import { Brackets, LessThanOrEqual, TreeRepository } from 'typeorm';
import { FileNodeResponseError } from './const/file-node.const';
import {
	BulkUpdateFileNodePermissionDto,
	CreateFileDto,
	CreateFolderDto,
	GetListFileNodeDto,
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

		private readonly userStorageService: UserStorageService,
		private readonly fileNodePermissionSv: FileNodePermissionService,
	) {}

	// create
	async createFolder({ req, dto }: { req: Request; dto: CreateFolderDto }) {
		const { fileNodeParentId, name } = dto;
		const { userId } = parseReq(req);

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

		const result = await this.fileNodeRepo.save(folder);

		if (fileNodeParentId) {
			await this.fileNodePermissionSv.generateChildPermissionsFromParent({
				fileNodeParentId,
				fileNodeChildrenId: folder.id,
			});
		}

		return result;
	}

	async createRootFolder(userId: string) {
		const folder = this.createFileNode({
			id: userId,
			name: userId,
			type: TYPE_FILE_NODE.FOLDER,
			ownerId: userId,
		});

		await this.userStorageService.createDefault({ userId });

		return this.fileNodeRepo.save(folder);
	}

	async createFile({ dto, req }: { dto: CreateFileDto; req: Request }) {
		const { name, fileNodeParentId, fileMetadata } = dto;
		const { userId } = parseReq(req);

		const parent = await this.validateAndGetParent(fileNodeParentId);

		await this.userStorageService.validateStorageCapacity({
			userId,
			fileSize: fileMetadata.fileSize,
		});

		if (fileNodeParentId) {
			await this.validateUniqueConstraint({
				fileNodeParentId,
				name,
				type: TYPE_FILE_NODE.FILE,
			});
		}
		const fileBucketDb = await this.bucketSv.getUploadUrl({
			...fileMetadata,
			folderBucket: { uploadPurpose: UploadPurpose.CASE_1 },
		});

		const entity = this.createFileNode({
			name,

			type: TYPE_FILE_NODE.FILE,
			parent,
			fileBucketId: fileBucketDb.id,
			ownerId: userId,
		});

		const saved = await this.fileNodeRepo.save(entity);

		if (fileNodeParentId) {
			await this.fileNodePermissionSv.generateChildPermissionsFromParent({
				fileNodeParentId,
				fileNodeChildrenId: saved.id,
			});
		}

		await this.userStorageService.increaseUsed({
			userId,
			size: fileMetadata.fileSize,
		});

		return { ...saved, uploadUrl: fileBucketDb.uploadUrl };
	}

	async upsertPermissions({
		dto,
		currentUser,
		fileNodeId,
	}: {
		dto: UpsertFileNodePermissionDto;
		currentUser: CurrentUser;
		fileNodeId: string;
	}) {
		const result: FileNodePermission[] = [];
		const fN = await this.findOneWithChildren(fileNodeId);

		for (const child of fN.fileNodeChildren) {
			const childPerms = await this.upsertPermissions({
				dto: { ...dto, fileNodeId: child.id },
				currentUser,
				fileNodeId: child.id,
			});
			result.push(...childPerms);
		}

		const perm = await this.fileNodePermissionSv.upsert({
			currentUser,
			dto: { ...dto, fileNodeId },
		});

		if (perm) result.push(perm);
		return result;
	}

	async bulkUpdateFileNodePermission({
		dto,
		currentUser,
		fileNodeId,
	}: {
		dto: BulkUpdateFileNodePermissionDto;
		currentUser: CurrentUser;
		fileNodeId: string;
	}) {
		const { upsert, remove } = dto;
		const resultUpsert: FileNodePermission[] = [];

		if (upsert) {
			for (const dtoUpsert of upsert) {
				const result = await this.upsertPermissions({
					dto: dtoUpsert,
					fileNodeId,
					currentUser,
				});

				resultUpsert.push(...result);
			}
		}

		if (remove) {
			await Promise.all(
				remove.map(async (permissionId) => {
					const canRemove = await this.fileNodePermissionSv.canRemove(
						{
							currentUser,
							permissionId,
						},
					);
					if (canRemove) {
						await this.fileNodePermissionSv.remove(permissionId);
					}
				}),
			);
		}

		return {
			resultUpsert,
			resultRemove: remove,
		};
	}

	// read
	async findOne(id: string) {
		const entity = await this.fileNodeRepo.findOne({ where: { id } });

		if (!entity) {
			throw FileNodeResponseError.FILE_NODE_NOT_FOUND();
		}

		return entity;
	}

	async findOneWithPermission(id: string) {
		const entity = await this.fileNodeRepo.findOne({
			where: { id },
			relations: {
				fileNodePermissions: true,
			},
		});

		if (!entity) {
			throw FileNodeResponseError.FILE_NODE_NOT_FOUND();
		}

		return entity;
	}

	async getPermissions(id: string) {
		const entity = await this.fileNodeRepo.findOne({
			where: { id },
			relations: {
				fileNodePermissions: {
					user: true,
					sharedBy: true,
				},
			},
		});

		if (!entity) {
			throw FileNodeResponseError.FILE_NODE_NOT_FOUND();
		}

		return entity.fileNodePermissions;
	}

	async getFile(id: string) {
		const entity = await this.fileNodeRepo.findOne({
			where: { id, type: TYPE_FILE_NODE.FILE },
		});

		if (!entity) {
			throw FileNodeResponseError.FILE_NOT_FOUND();
		}

		return entity;
	}

	async getChildren({
		id,
		filter,
		currentUser,
	}: {
		id: string;
		filter: GetListFileNodeDto;
		currentUser?: CurrentUser;
	}) {
		filter.fileNodeParentId = id;
		filter.isDelete = false;
		const data = await this.getList({ currentUser, filter });
		return data;
	}

	async getBreadcrumbs(id: string) {
		const node = await this.fileNodeRepo.findOne({
			where: { id },
			relations: ['fileNodeParent'],
		});

		if (!node) {
			throw FileNodeResponseError.FILE_NODE_NOT_FOUND();
		}

		const parents = await this.fileNodeRepo.manager
			.getTreeRepository(FileNode)
			.findAncestors(node);

		parents[0].name = 'Home';

		return parents;
	}

	async findOneWithChildren(id: string) {
		const entity = await this.fileNodeRepo.findOne({
			where: { id },
			relations: { fileNodeChildren: true },
		});

		if (!entity) {
			throw FileNodeResponseError.FILE_NODE_NOT_FOUND();
		}

		return entity;
	}

	async findOneWithChildrenAndFileBucket(id: string) {
		const entity = await this.fileNodeRepo.findOne({
			where: { id },
			relations: {
				fileBucket: true,
				fileNodeChildren: {
					fileBucket: true,
				},
			},
		});

		if (!entity) {
			throw FileNodeResponseError.FILE_NODE_NOT_FOUND();
		}

		return entity;
	}

	async findOneFullTree(id: string): Promise<FileNode | null> {
		const node = await this.findOne(id);
		return await this.fileNodeRepo.findDescendantsTree(node);
	}

	async readFile(id: string) {
		const file = await this.getFile(id);
		const data = await this.bucketSv.getReadUrl(file.fileBucketId ?? '');

		return { id, fileBucket: data };
	}

	async getList({
		currentUser,
		filter,
	}: {
		currentUser?: CurrentUser;
		filter: GetListFileNodeDto;
	}) {
		const { fileNodeParentId, keywords, isDelete } = filter;
		const qb = this.createQbUtils.createFileNodeQb();

		this.whereUtils.applyFilter({
			qb,
			filter: new OrmFilterDto({
				fileNodeParentId,
				keywordsFileNode: keywords,
				fileNodeIsDelete: isDelete,
				...filter,
			}),
		});

		if (currentUser) {
			const { userId, roles } = currentUser;

			if (roles && !roles.includes('Admin')) {
				qb.leftJoin(
					'fileNode.fileNodePermissions',
					'fileNodePermission',
				);
				qb.andWhere(
					new Brackets((qb1) => {
						qb1.where(
							'fileNodePermission.canView = true AND fileNodePermission.userId = :userId',
							{ userId },
						).orWhere('fileNode.ownerId = :userId', { userId });
					}),
				);
			}
		}

		const [items, totalItems] = await qb.getManyAndCount();
		return new PageDto({ items, metadata: { ...filter, totalItems } });
	}

	async createRootIfNotExists(userId: string) {
		try {
			await this.findOne(userId);
		} catch {
			await this.createRootFolder(userId);
		}
	}

	async getHome({
		req,
		filter,
	}: {
		req: Request;
		filter: GetListFileNodeDto;
	}) {
		const { userId } = parseReq(req);

		await this.createRootIfNotExists(userId);

		const qb = this.createQbUtils.createFileNodeQb();
		const filterOrm = new OrmFilterDto({
			fileNodeParentId: userId,
		});

		this.whereUtils.applyFilter({ qb, filter: filterOrm });

		const [items, totalItems] = await qb.getManyAndCount();
		return new PageDto({ items, metadata: { ...filter, totalItems } });
	}

	async getListWithChildren({
		filter,
	}: {
		req: Request;
		filter: GetListFileNodeDto;
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
		filter,
	}: {
		req: Request;
		filter: GetListFileNodeDto;
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

	async delete(id: string) {
		const entity = await this.findOneWithChildren(id);

		if (entity.isDelete) {
			await this.deletePermanent(id);
		} else {
			await this.moveToTrash(id);
		}
	}

	async moveToTrash(id: string) {
		const entity = await this.findOneWithChildren(id);

		const now = new Date();
		await this.fileNodeRepo.update(id, { deletedAt: now, isDelete: true });

		if (entity.fileNodeChildren?.length) {
			await Promise.all(
				entity.fileNodeChildren.map((child) =>
					this.moveToTrash(child.id),
				),
			);
		}
	}

	async deletePermanent(id: string) {
		const fileNode = await this.findOneWithChildrenAndFileBucket(id);
		const { fileNodeChildren } = fileNode;

		if (fileNodeChildren.length) {
			await Promise.all(
				fileNodeChildren.map((child) => this.deletePermanent(child.id)),
			);
		}

		await this.fileNodeRepo.delete(fileNode.id);

		if (fileNode.type === TYPE_FILE_NODE.FILE && fileNode.fileBucketId) {
			await this.bucketSv.deleteSafe(fileNode.fileBucketId);
			await this.userStorageService.decreaseUsed({
				userId: fileNode.ownerId,
				size: fileNode.fileBucket?.fileSize ?? 0,
			});
		}
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

	async deleteByUserId(userId: string) {
		await this.fileNodeRepo.delete({ ownerId: userId });
		await this.userStorageService.deleteByUserId(userId);
	}

	// private
	private async isFolder(parentId: string) {
		const entity = await this.findOne(parentId);
		if (entity.type !== TYPE_FILE_NODE.FOLDER) {
			throw FileNodeResponseError.INVALID_PARENT_ID();
		}
	}

	private async validateUniqueConstraint({
		fileNodeParentId,
		name,
		type,
		isDelete = false,
	}: {
		fileNodeParentId: string;
		name: string;
		type: TYPE_FILE_NODE;
		isDelete?: boolean;
	}) {
		const isExists = await this.fileNodeRepo.findOne({
			where: {
				fileNodeParentId,
				name,
				type,
				isDelete,
			},
		});

		if (isExists) {
			throw FileNodeResponseError.FILE_NODE_ALREADY_EXISTS();
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
