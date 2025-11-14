import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { CurrentUser } from 'src/common/interface/common.interface';
import { IS_ADMIN } from 'src/common/util/common.util';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { Repository } from 'typeorm';
import {
	UpdateFileNodePermissionDto,
	UpsertFileNodePermissionDto,
} from './dto/file-node-permission.dto';
import { FileNodePermission } from './entities/file-node-permission.entity';

@Injectable()
export class FileNodePermissionService {
	constructor(
		@InjectRepository(FileNodePermission)
		private fileNodePermissionRepo: Repository<FileNodePermission>,

		@InjectRepository(FileNode)
		private fileNodeRepo: Repository<FileNode>,
	) {}

	async generateChildPermissionsFromParent({
		fileNodeChildrenId,
		fileNodeParentId,
	}: {
		fileNodeParentId: string;
		fileNodeChildrenId: string;
	}) {
		const permissionsParent = await this.findByFileNode(fileNodeParentId);

		const newPermissions = permissionsParent.map((i) => ({
			fileNodeId: fileNodeChildrenId,
			userId: i.userId,
			canView: i.canView,
			canEdit: i.canEdit,
			sharedById: i.sharedById,
			// canDelete: i.canDelete,
			// canUpload: i.canUpload,
			// canShare: i.canShare,
		}));

		await this.fileNodePermissionRepo.save(newPermissions);
	}

	async upsert({
		currentUser,
		dto,
	}: {
		currentUser: CurrentUser;
		dto: UpsertFileNodePermissionDto;
	}) {
		console.log(dto);

		const { canEditPermission, canEdit, canView } =
			await this.checkPermissions({
				currentUser,
				fileNodeId: dto.fileNodeId,
			});

		if (!canEditPermission) {
			return;
		}

		if (dto.canEdit) {
			dto.canEdit = canEdit;
		}

		if (dto.canView) {
			dto.canView = canView;
		}

		const perm = this.fileNodePermissionRepo.create({
			...dto,
			sharedById: currentUser.userId,
		});

		await this.fileNodePermissionRepo.upsert(perm, [
			'fileNodeId',
			'userId',
		]);

		return this.fileNodePermissionRepo.findOne({
			where: {
				fileNodeId: dto.fileNodeId ?? '',
				userId: dto.userId ?? '',
			},
		});
	}

	async findFileNode(id: string) {
		const fN = await this.fileNodeRepo.findOne({ where: { id } });
		if (!fN) {
			throw new ResponseError({
				message: 'File node not found',
			});
		}

		return fN;
	}

	async findOne(id: string) {
		const e = await this.fileNodePermissionRepo.findOne({ where: { id } });
		if (!e) {
			throw new ResponseError({
				message: 'File node permission not found',
			});
		}

		return e;
	}

	async findOne2(input: { userId?: string | null; fileNodeId: string }) {
		const e = await this.fileNodePermissionRepo.findOne({
			where: {
				fileNodeId: input.fileNodeId,
				...(input.userId ? { userId: input.userId } : {}),
			},
		});

		if (!e) {
			throw new ResponseError({
				message: 'File node permission not found',
			});
		}

		return e;
	}

	async findOne2Safe(input: { userId?: string | null; fileNodeId: string }) {
		const e = await this.fileNodePermissionRepo.findOne({
			where: {
				fileNodeId: input.fileNodeId,
				...(input.userId ? { userId: input.userId } : {}),
			},
		});

		return e;
	}

	async findOneWithFileNode(id: string) {
		const e = await this.fileNodePermissionRepo.findOne({
			where: { id },
			relations: { fileNode: true },
		});
		if (!e) {
			throw new ResponseError({
				message: 'File node permission not found',
			});
		}

		return e;
	}

	// v2: id -> file node id + user id
	async findOneWithFileNode2({
		fileNodeId,
		userId,
	}: {
		fileNodeId: string;
		userId: string;
	}) {
		const e = await this.fileNodePermissionRepo.findOne({
			where: {
				fileNodeId,
				userId,
			},
			relations: { fileNode: true },
		});

		if (!e) {
			throw new ResponseError({
				message: 'File node permission not found',
			});
		}

		return e;
	}

	async findByFileNode(fileNodeId: string) {
		return this.fileNodePermissionRepo.find({ where: { fileNodeId } });
	}

	async update(id: string, data: UpdateFileNodePermissionDto) {
		await this.fileNodePermissionRepo.update(id, data);
		return this.findOne(id);
	}

	async remove(id: string) {
		return this.fileNodePermissionRepo.delete(id);
	}

	async getEffectivePermission(fileNodeId: string, userId: string) {
		return this.fileNodePermissionRepo
			.createQueryBuilder('p')
			.innerJoin(
				'file_node_closure',
				'c',
				'p.file_node_id = c.id_ancestor',
			)
			.where('c.id_descendant = :fileNodeId', { fileNodeId })
			.andWhere('p.user_id = :userId', { userId })
			.andWhere('p.share_type IN (:...types)', {
				types: ['direct', 'inherited'],
			})
			.orderBy('c.depth', 'ASC')
			.getOne();
	}

	async checkPermissions({
		currentUser,
		fileNodeId,
	}: {
		currentUser: CurrentUser;
		fileNodeId: string;
	}) {
		const { userId } = currentUser;

		if (IS_ADMIN(currentUser)) {
			return {
				canView: true,
				canEdit: true,
				canEditPermission: true,
				// canDeletePermission: true,
			};
		}

		const fileNode = await this.findFileNode(fileNodeId);

		if (fileNode.ownerId === currentUser.userId) {
			return {
				canView: true,
				canEdit: true,
				canEditPermission: true,
				// canDeletePermission: true,
			};
		}

		const per = await this.fileNodePermissionRepo.findOne({
			where: { fileNodeId, userId },
		});

		console.log(per);

		if (per) {
			return {
				canView: per.canView,
				canEdit: per.canEdit,
				canEditPermission: per.sharedById === userId,
				// canDeletePermission: true,
			};
		}

		return {
			canView: false,
			canEdit: false,
			canEditPermission: false,
			// canDeletePermission: false,
		};
	}

	async canRemove({
		currentUser,
		permissionId,
	}: {
		currentUser: CurrentUser;
		permissionId: string;
	}) {
		const { userId } = currentUser;

		if (IS_ADMIN(currentUser)) {
			return true;
		}

		const p = await this.findOneWithFileNode(permissionId);

		if (p.sharedById === userId || p.fileNode.ownerId === userId) {
			return true;
		}

		return false;
	}
}
