import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto, ResponseError } from 'src/common/dto/common.response-dto';
import { TreeRepository } from 'typeorm';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';
import { Folder } from './entities/folder.entity';

@Injectable()
export class FolderService {
	constructor(
		@InjectRepository(Folder)
		private readonly folderRepo: TreeRepository<Folder>,
	) {}

	async create({
		dto,
		userId,
	}: {
		dto: CreateFolderDto;
		userId: string;
	}): Promise<Folder> {
		const { parentId, name } = dto;

		if (parentId) {
			await this.findOne(parentId);
		}

		const folder = this.folderRepo.create({ name, parentId, userId });
		return this.folderRepo.save(folder);
	}

	async findAllTree() {
		const items = await this.folderRepo.findTrees();
		return new PageDto({ items });
	}

	async findOne(id: string): Promise<Folder> {
		const folder = await this.folderRepo.findOne({
			where: { id },
			relations: ['parent', 'children'],
		});
		if (!folder) throw new ResponseError({ message: 'Folder not found' });
		return folder;
	}

	async update(id: string, dto: UpdateFolderDto): Promise<Folder> {
		const folder = await this.findOne(id);
		Object.assign(folder, dto);
		return this.folderRepo.save(folder);
	}

	async remove(id: string): Promise<void> {
		const folder = await this.findOne(id);
		await this.folderRepo.remove(folder);
	}
}
