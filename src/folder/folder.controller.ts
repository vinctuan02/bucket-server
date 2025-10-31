import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import { GetUserId } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';
import { FolderService } from './folder.service';

@Controller('folders')
export class FolderController {
	constructor(private readonly folderService: FolderService) {}

	@Post()
	async create(@GetUserId() userId: string, @Body() dto: CreateFolderDto) {
		const data = await this.folderService.create({ dto, userId });
		return new ResponseSuccess({ data });
	}

	@Get()
	async findAllTree() {
		const data = await this.folderService.findAllTree();

		return new ResponseSuccess({ data });
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const data = await this.folderService.findOne(id);

		return new ResponseSuccess({ data });
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateFolderDto) {
		const data = await this.folderService.update(id, dto);

		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		const data = await this.folderService.remove(id);

		return new ResponseSuccess({ data });
	}
}
