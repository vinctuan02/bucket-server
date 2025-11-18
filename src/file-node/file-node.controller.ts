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
	Res,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import * as fs from 'fs';
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
import { FileNodeDownloadService } from './services/file-node-download.service';
import { FileManagerService } from './services/file-node.service';

@ApiTags('File Manager')
@ApiBearerAuth()
@Controller('file-manager')
export class FileManagerController {
	constructor(
		private readonly service: FileManagerService,
		private readonly downloadService: FileNodeDownloadService,
	) {}

	@Post('folder')
	@ApiOperation({ summary: 'Create a new folder' })
	@ApiBody({ type: CreateFolderDto })
	@ApiResponse({ status: 201, description: 'Folder created successfully' })
	async createFolder(@Req() req: Request, @Body() dto: CreateFolderDto) {
		const data = await this.service.createFolder({ req, dto });
		return new ResponseSuccess({ data });
	}

	@Post('file')
	@ApiOperation({ summary: 'Create a new file' })
	@ApiBody({ type: CreateFileDto })
	@ApiResponse({ status: 201, description: 'File created successfully' })
	async createFile(@Body() dto: CreateFileDto, @Req() req: Request) {
		const data = await this.service.createFile({ dto, req });
		return new ResponseSuccess({ data });
	}

	@Post(':id/permission')
	@ApiOperation({ summary: 'Add or update permission for a file/folder' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiBody({ type: UpsertFileNodePermissionDto })
	@ApiResponse({
		status: 200,
		description: 'Permission updated successfully',
	})
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
	@ApiOperation({ summary: 'Bulk update permissions for multiple users' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiBody({ type: BulkUpdateFileNodePermissionDto })
	@ApiResponse({
		status: 200,
		description: 'Permissions updated successfully',
	})
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

	@Put(':id/restore')
	@ApiOperation({ summary: 'Restore file/folder from trash' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'File/folder restored successfully',
	})
	async restore(@Param('id') id: string) {
		const data = await this.service.restore(id);
		return new ResponseSuccess({ data });
	}

	@Get()
	@ApiOperation({ summary: 'Get list of files/folders' })
	@ApiQuery({ type: GetListFileNodeDto })
	@ApiResponse({ status: 200, description: 'List of files/folders' })
	async getList(
		@User() currentUser: CurrentUser,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getList({ currentUser, filter });
		return new ResponseSuccess({ data });
	}

	@Get('trash')
	@ApiOperation({ summary: 'Get trashed files and folders' })
	@ApiQuery({ type: GetListFileNodeDto })
	@ApiResponse({
		status: 200,
		description: 'List of trashed files and folders',
	})
	async getTrashedFileNodes(
		@User() currentUser: CurrentUser,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getTrashedFileNodes({
			currentUser,
			filter,
		});
		return new ResponseSuccess({ data });
	}

	@Get('share-with-me')
	@ApiOperation({
		summary: 'Get files and folders shared with the current user',
	})
	@ApiQuery({ type: GetListFileNodeDto })
	@ApiResponse({
		status: 200,
		description: 'List of files and folders shared with the current user',
	})
	async getSharedWithMeFileNodes(
		@User() currentUser: CurrentUser,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getSharedWithMeFileNodes({
			currentUser,
			filter,
		});
		return new ResponseSuccess({ data });
	}

	@Get('home')
	@ApiOperation({ summary: 'Get home directory (root folder)' })
	@ApiQuery({ type: GetListFileNodeDto })
	@ApiResponse({ status: 200, description: 'Home directory contents' })
	async getHome(@Req() req: Request, @Query() filter: GetListFileNodeDto) {
		const data = await this.service.getHome({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get('with-children')
	@ApiOperation({ summary: 'Get files/folders with immediate children' })
	@ApiQuery({ type: GetListFileNodeDto })
	@ApiResponse({ status: 200, description: 'Files/folders with children' })
	async getListWithChildren(
		@Req() req: Request,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getListWithChildren({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get('full-tree')
	@ApiOperation({ summary: 'Get complete folder tree structure' })
	@ApiQuery({ type: GetListFileNodeDto })
	@ApiResponse({ status: 200, description: 'Complete folder tree' })
	async getListFullTree(
		@Req() req: Request,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getListFullTree({ req, filter });
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get file/folder details by ID' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({ status: 200, description: 'File/folder details' })
	async findOne(@Param('id') id: string) {
		const data = await this.service.findOne(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/with-permission')
	@ApiOperation({ summary: 'Get file/folder with permission details' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({ status: 200, description: 'File/folder with permissions' })
	async findOneWithPermission(@Param('id') id: string) {
		const data = await this.service.findOneWithPermission(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/permissions')
	@ApiOperation({ summary: 'Get all permissions for a file/folder' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({ status: 200, description: 'List of permissions' })
	async getPermissions(@Param('id') id: string) {
		const data = await this.service.getPermissions(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/children')
	@ApiOperation({ summary: 'Get immediate children of a folder' })
	@ApiParam({ name: 'id', type: 'string', description: 'Folder ID (UUID)' })
	@ApiQuery({ type: GetListFileNodeDto })
	@ApiResponse({ status: 200, description: 'List of children' })
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
	@ApiOperation({ summary: 'Get breadcrumb path to file/folder' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({ status: 200, description: 'Breadcrumb path' })
	async getBreadcrumbs(@Param('id') id: string) {
		const data = await this.service.getBreadcrumbs(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/with-children')
	@ApiOperation({ summary: 'Get file/folder with immediate children' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({ status: 200, description: 'File/folder with children' })
	async findOneWithChildren(@Param('id') id: string) {
		const data = await this.service.findOneWithChildren(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/full-tree')
	@ApiOperation({ summary: 'Get file/folder with complete tree structure' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({ status: 200, description: 'File/folder with full tree' })
	async findOneFullTree(@Param('id') id: string) {
		const data = await this.service.findOneFullTree(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/read')
	@ApiOperation({ summary: 'Read file content' })
	@ApiParam({ name: 'id', type: 'string', description: 'File ID (UUID)' })
	@ApiResponse({ status: 200, description: 'File content' })
	async readFile(@Param('id') id: string) {
		const data = await this.service.readFile(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/zip')
	@ApiOperation({
		summary: 'Create zip file for download',
		description:
			'Create a zip archive of a file or folder and return the download path',
	})
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'Zip file created, returns download path',
		schema: {
			example: { path: '/downloads/file-123.zip' },
		},
	})
	async createZip(@Param('id') id: string) {
		const data = await this.downloadService.createZip(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/download/:path')
	@ApiOperation({
		summary: 'Download zip file by path',
		description:
			'Download a previously created zip file and delete it from server after download',
	})
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiParam({
		name: 'path',
		type: 'string',
		description: 'Relative path to zip file (from /downloads)',
	})
	@ApiResponse({ status: 200, description: 'File downloaded and deleted' })
	async downloadZip(
		@Param('id') id: string,
		@Param('path') path: string,
		@Res() res: Response,
	) {
		try {
			const filePath = await this.downloadService.getDownloadPath(
				id,
				path,
			);

			// Set response headers
			res.setHeader(
				'Content-Disposition',
				`attachment; filename="${encodeURIComponent(path)}"`,
			);
			res.setHeader('Content-Type', 'application/zip');

			// Stream file to response
			const fileStream = fs.createReadStream(filePath);
			fileStream.pipe(res);

			// Clean up file after sending
			fileStream.on('end', () => {
				fs.unlink(filePath, () => {
					// Silently ignore errors
				});
			});

			fileStream.on('error', () => {
				res.status(500).json({ error: 'Failed to download file' });
				fs.unlink(filePath, () => {
					// Silently ignore errors
				});
			});
		} catch (error) {
			res.status(500).json({
				error:
					error instanceof Error ? error.message : 'Download failed',
			});
		}
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Soft delete file/folder (move to trash)' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'File/folder deleted successfully',
	})
	async delete(@Req() req: Request, @Param('id') id: string) {
		await this.service.delete(id);
	}

	@Delete(':id/permanent')
	@ApiOperation({ summary: 'Permanently delete file/folder' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'File/folder permanently deleted',
	})
	async deletePermanent(@Req() req: Request, @Param('id') id: string) {
		await this.service.deletePermanent(id);
	}
}
