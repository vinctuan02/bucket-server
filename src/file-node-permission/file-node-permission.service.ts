import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
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
	) {}

	async upsert({
		userId,
		dto,
	}: {
		userId: string;
		dto: UpsertFileNodePermissionDto;
	}) {
		const perm = this.fileNodePermissionRepo.create({
			...dto,
			sharedById: userId,
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

	async findOne(id: string) {
		const e = await this.fileNodePermissionRepo.findOne({ where: { id } });
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
}
