// src/modules/file-manager/file-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { DEFAULT_TRASH_RETENTION_DAYS } from 'src/app-config/const/app-config.const';
import { AppConfigService } from 'src/app-config/services/app-config.service';
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
import { OrmUtilsJoin } from 'src/orm-utils/services/orm-utils.join';
import { OrmUtilsSelect } from 'src/orm-utils/services/orm-utils.select';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { UserStorageService } from 'src/user-storage/user-storage.service';
import { User } from 'src/users/entities/user.entity';
import { Brackets, LessThanOrEqual, Repository, TreeRepository } from 'typeorm';
import { FileNodeResponseError } from '../const/file-node.const';
import {
	BulkUpdateFileNodePermissionDto,
	CreateFileDto,
	CreateFolderDto,
	GetListFileNodeDto,
} from '../dto/file-node.dto';
import { FileNode } from '../entities/file-node.entity';
import { TYPE_FILE_NODE } from '../enum/file-node.enum';

@Injectable()
export class FileManagerService {
	private readonly logger = new Logger(FileManagerService.name);

	constructor(
		@InjectRepository(FileNode)
		private readonly fileNodeRepo: TreeRepository<FileNode>,

		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		private readonly configService: ConfigService,

		private readonly bucketSv: BucketService,

		private readonly createQbUtils: OrmUtilsCreateQb,
		private readonly whereUtils: OrmUtilsWhere,
		private readonly selectUtils: OrmUtilsSelect,

		private readonly userStorageService: UserStorageService,
		private readonly fileNodePermissionSv: FileNodePermissionService,
		private readonly ormUtilsJoin: OrmUtilsJoin,
		private readonly appConfigService: AppConfigService,
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
				ownerId: userId,
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
				ownerId: userId,
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

		// Sắp xếp theo depth: root (fileNodeParentId = null) ở đầu
		parents.sort((a, b) => {
			const aIsRoot = a.fileNodeParentId === null ? 0 : 1;
			const bIsRoot = b.fileNodeParentId === null ? 0 : 1;
			return aIsRoot - bIsRoot;
		});

		// Gán tên 'Home' cho root node
		if (parents.length > 0 && parents[0].fileNodeParentId === null) {
			parents[0].name = 'Home';
		}

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
		this.ormUtilsJoin.leftJoinFileNodeWithFileBucket(qb);

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

		qb.addSelect([
			'fileBucket.id',
			'fileBucket.fileName',
			'fileBucket.fileSize',
			'fileBucket.contentType',
		]);

		const [items, totalItems] = await qb.getManyAndCount();
		return new PageDto({ items, metadata: { ...filter, totalItems } });
	}

	async getTrashedFileNodes({
		currentUser,
		filter,
	}: {
		currentUser?: CurrentUser;
		filter: GetListFileNodeDto;
	}) {
		const { fileNodeParentId, keywords } = filter;
		const qb = this.createQbUtils.createFileNodeQb();
		this.ormUtilsJoin.leftJoinFileNodeWithFileBucket(qb);

		this.whereUtils.applyFilter({
			qb,
			filter: new OrmFilterDto({
				fileNodeParentId,
				keywordsFileNode: keywords,
				fileNodeIsDelete: true,
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

		qb.addSelect([
			'fileBucket.id',
			'fileBucket.fileName',
			'fileBucket.fileSize',
			'fileBucket.contentType',
		]);

		const [items, totalItems] = await qb.getManyAndCount();
		return new PageDto({
			items: this.buildTrees(items),
			// items,
			metadata: { ...filter, totalItems },
		});
	}

	async getSharedWithMeFileNodes({
		currentUser,
		filter,
	}: {
		currentUser?: CurrentUser;
		filter: GetListFileNodeDto;
	}) {
		const { fileNodeParentId, keywords } = filter;
		const qb = this.createQbUtils.createFileNodeQb();
		this.ormUtilsJoin.leftJoinFileNodeWithFileBucket(qb);

		this.whereUtils.applyFilter({
			qb,
			filter: new OrmFilterDto({
				fileNodeParentId,
				keywordsFileNode: keywords,
				fileNodeIsDelete: false,
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
					'fileNodePermission.canView = true AND fileNodePermission.userId = :userId',
					{
						userId,
					},
				).andWhere('fileNode.ownerId != :userId', { userId });
			}
		}

		const [items, totalItems] = await qb.getManyAndCount();
		return new PageDto({
			items: this.buildTrees(items),
			// items,
			metadata: { ...filter, totalItems },
		});
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
		const isExists = await this.findOneWithChildren(id);

		if (isExists.isDelete) {
			await this.deletePermanent(id);
		} else {
			await this.moveToTrash(id);
		}
	}

	async moveToTrash(id: string) {
		const entity = await this.findOneWithChildren(id);

		const now = new Date();

		// Get retention period for the file owner
		const retentionDays = await this.getRetentionPeriod(entity.ownerId);

		// Calculate scheduled deletion date
		const scheduledDeletionAt = new Date(now);
		scheduledDeletionAt.setDate(
			scheduledDeletionAt.getDate() + retentionDays,
		);

		await this.fileNodeRepo.update(id, {
			deletedAt: now,
			isDelete: true,
			scheduledDeletionAt,
		});

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
		const now = new Date();

		const expiredFiles = await this.fileNodeRepo.find({
			where: {
				scheduledDeletionAt: LessThanOrEqual(now),
				isDelete: true,
			},
		});

		this.logger.log(`Found ${expiredFiles.length} expired files to delete`);

		for (const file of expiredFiles) {
			try {
				await this.deletePermanent(file.id);
				this.logger.verbose(`Successfully deleted file ${file.id}`);
			} catch (e) {
				this.logger.error(`Delete failed for ${file.id}`, e);
			}
		}

		this.logger.log(
			`Cron job completed. Processed ${expiredFiles.length} files`,
		);
	}

	async restore(id: string) {
		const entity = await this.findOneWithChildren(id);

		await this.fileNodeRepo.update(id, {
			deletedAt: null,
			isDelete: false,
			scheduledDeletionAt: null,
		});

		if (entity.fileNodeChildren?.length) {
			await Promise.all(
				entity.fileNodeChildren.map((child) => this.restore(child.id)),
			);
		}

		return entity;
	}

	async deleteByUserId(userId: string) {
		await this.fileNodeRepo.delete({ ownerId: userId });
		await this.userStorageService.deleteByUserId(userId);
	}

	async getRetentionPeriod(userId: string): Promise<number> {
		// 1. Check user's personal retention period
		const user = await this.userRepo.findOne({
			where: { id: userId },
			select: ['id', 'trashRetentionDays'],
		});

		if (user?.trashRetentionDays) {
			return user.trashRetentionDays;
		}

		// 2. Fall back to app config
		try {
			const config = await this.appConfigService.getConfig();
			if (config.trashRetentionDays) {
				return config.trashRetentionDays;
			}
		} catch (error) {
			this.logger.warn(
				'Failed to fetch app config, using default',
				error,
			);
		}

		// 3. Fall back to hardcoded default
		return DEFAULT_TRASH_RETENTION_DAYS;
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
		ownerId,
	}: {
		fileNodeParentId: string;
		name: string;
		ownerId: string;
		type: TYPE_FILE_NODE;
		isDelete?: boolean;
	}) {
		const isExists = await this.fileNodeRepo.findOne({
			where: {
				fileNodeParentId,
				name,
				type,
				isDelete,
				ownerId,
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

	private buildTrees(fileNodes: FileNode[]): FileNode[] {
		// Create a map for quick lookup by id
		const nodeMap = new Map<string, FileNode>();
		const nodeIds = new Set(fileNodes.map((n) => n.id));

		// First pass: populate map
		fileNodes.forEach((node) => {
			nodeMap.set(node.id, { ...node, fileNodeChildren: [] });
		});

		// Second pass: build tree structure and identify roots
		// Root = node whose parent is NOT in the provided list
		const roots: FileNode[] = [];
		fileNodes.forEach((node) => {
			if (node.fileNodeParentId && nodeIds.has(node.fileNodeParentId)) {
				// Parent exists in the list, add as child
				const parent = nodeMap.get(node.fileNodeParentId);
				const child = nodeMap.get(node.id);
				if (parent && child) {
					parent.fileNodeChildren.push(child);
				}
			} else if (
				!node.fileNodeParentId ||
				!nodeIds.has(node.fileNodeParentId)
			) {
				// Parent doesn't exist in list or node has no parent = root
				const root = nodeMap.get(node.id);
				if (root) {
					roots.push(root);
				}
			}
		});

		return roots;
	}
}
