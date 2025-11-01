// src/modules/file-manager/file-manager.controller.ts
import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
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

	@Get()
	async getList(@Req() req: Request, @Query() filter: GetlistFileNodeDto) {
		const data = await this.service.getList({ req, filter });
		return new ResponseSuccess({ data });
	}
}
