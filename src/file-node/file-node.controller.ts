// src/modules/file-manager/file-manager.controller.ts
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import {
	CreateFileDto,
	CreateFolderDto,
	GetlistFileNodeDto,
} from './dto/file-node.dto';
import { FileManagerService } from './file-node.service';

@Controller('file-manager')
export class FileManagerController {
	constructor(private readonly service: FileManagerService) {}

	@Post('folder')
	async createFolder(@Req() req: Request, @Body() dto: CreateFolderDto) {
		const data = await this.service.createFolder({ req, dto });
		return new ResponseSuccess({ data });
	}

	@Post('file')
	async createFile(@Body() dto: CreateFileDto) {
		const data = await this.service.createFile(dto);
		return new ResponseSuccess({ data });
	}

	// @Post(':id/submit-file')
	// async submitFile(@Body() dto: CreateFileDto) {
	// 	const data = await this.service.createFile(dto);
	// 	return new ResponseSuccess({ data });
	// }

	@Get()
	async getList(@Req() req: Request, @Query() filter: GetlistFileNodeDto) {
		const data = await this.service.getList({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get('home')
	async getHome(@Req() req: Request, @Query() filter: GetlistFileNodeDto) {
		const data = await this.service.getHome({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get('with-childrens')
	async getListWithChildrens(
		@Req() req: Request,
		@Query() filter: GetlistFileNodeDto,
	) {
		const data = await this.service.getListWithChildrens({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get('full-tree')
	async getListFullTree(
		@Req() req: Request,
		@Query() filter: GetlistFileNodeDto,
	) {
		const data = await this.service.getListFullTree({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const data = await this.service.findOne(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/with-childrens')
	async findOneWithChildrens(@Param('id') id: string) {
		const data = await this.service.findOneWithChildren(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/full-tree')
	async findOneFullTree(@Param('id') id: string) {
		const data = await this.service.findOneFullTree(id);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	async delete(@Req() req: Request, @Param('id') id: string) {
		await this.service.moveToTrash(id);
	}

	@Delete(':id/permanent')
	async deletePermanent(@Req() req: Request, @Param('id') id: string) {
		await this.service.deletePermanent(id);
	}
}
