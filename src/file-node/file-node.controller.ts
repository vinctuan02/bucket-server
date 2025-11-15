// src/modules/file-manager/file-manager.controller.ts
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	Req,
} from '@nestjs/common';
import type { Request } from 'express-serve-static-core';
import { User } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import type { CurrentUser } from 'src/common/interface/common.interface';
import { UpsertFileNodePermissionDto } from 'src/file-node-permission/dto/file-node-permission.dto';
import {
	BulkUpdateFileNodePermissionDto,
	CreateFileDto,
	CreateFolderDto,
	GetListFileNodeDto,
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
	async createFile(@Body() dto: CreateFileDto, @Req() req: Request) {
		const data = await this.service.createFile({ dto, req });
		return new ResponseSuccess({ data });
	}

	@Post(':id/permission')
	async upsertPermissions(
		@Param('id') fileNodeId: string,
		@Body() dto: UpsertFileNodePermissionDto,
		@User() currentUser: CurrentUser,
	) {
		const data = await this.service.upsertPermissions({
			fileNodeId,
			dto,
			currentUser,
		});
		return new ResponseSuccess({ data });
	}

	@Put(':id/bulk/permission')
	async bulkUpdateFileNodePermission(
		@Param('id') fileNodeId: string,
		@Body() dto: BulkUpdateFileNodePermissionDto,
		@User() currentUser: CurrentUser,
	) {
		const data = await this.service.bulkUpdateFileNodePermission({
			fileNodeId,
			dto,
			currentUser,
		});
		return new ResponseSuccess({ data });
	}

	@Get()
	async getList(
		@User() currentUser: CurrentUser,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getList({ currentUser, filter });
		return new ResponseSuccess({ data });
	}

	@Get('home')
	async getHome(@Req() req: Request, @Query() filter: GetListFileNodeDto) {
		const data = await this.service.getHome({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get('with-children')
	async getListWithChildren(
		@Req() req: Request,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getListWithChildren({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get('full-tree')
	async getListFullTree(
		@Req() req: Request,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getListFullTree({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const data = await this.service.findOne(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/with-permission')
	async findOneWithPermission(@Param('id') id: string) {
		const data = await this.service.findOneWithPermission(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/permissions')
	async getPermissions(@Param('id') id: string) {
		const data = await this.service.getPermissions(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/children')
	async getChildren(
		@Param('id') id: string,
		@User() currentUser: CurrentUser,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getChildren({
			id,
			filter,
			currentUser,
		});
		return new ResponseSuccess({ data });
	}

	@Get(':id/breadcrumbs')
	async getBreadcrumbs(@Param('id') id: string) {
		const data = await this.service.getBreadcrumbs(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/with-children')
	async findOneWithChildren(@Param('id') id: string) {
		const data = await this.service.findOneWithChildren(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/full-tree')
	async findOneFullTree(@Param('id') id: string) {
		const data = await this.service.findOneFullTree(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/read')
	async readFile(@Param('id') id: string) {
		const data = await this.service.readFile(id);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	async delete(@Req() req: Request, @Param('id') id: string) {
		await this.service.delete(id);
	}

	@Delete(':id/permanent')
	async deletePermanent(@Req() req: Request, @Param('id') id: string) {
		await this.service.deletePermanent(id);
	}
}
