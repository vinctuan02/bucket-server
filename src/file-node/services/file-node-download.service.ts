import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import { BucketService } from 'src/bucket/services/bucket.service';
import { TreeRepository } from 'typeorm';
import { FileNode } from '../entities/file-node.entity';
import { TYPE_FILE_NODE } from '../enum/file-node.enum';

@Injectable()
export class FileNodeDownloadService {
	private readonly logger = new Logger(FileNodeDownloadService.name);
	private readonly downloadDir = path.join(process.cwd(), 'downloads');

	constructor(
		@InjectRepository(FileNode)
		private readonly fileNodeRepo: TreeRepository<FileNode>,
		private readonly bucketSv: BucketService,
		private readonly configService: ConfigService,
	) {
		this.ensureDownloadDir();
	}

	private ensureDownloadDir() {
		if (!fs.existsSync(this.downloadDir)) {
			fs.mkdirSync(this.downloadDir, { recursive: true });
		}
	}

	async downloadFileNode(fileNodeId: string): Promise<{
		filePath: string;
		fileName: string;
	}> {
		const fileNode = await this.fileNodeRepo.findOne({
			where: { id: fileNodeId },
		});

		if (!fileNode) {
			throw new Error(`File node not found: ${fileNodeId}`);
		}

		// If it's a single file, return the file directly
		if (fileNode.type === TYPE_FILE_NODE.FILE) {
			return this.downloadSingleFile(fileNode);
		}

		// If it's a folder, create a zip
		return this.downloadFolderAsZip(fileNode);
	}

	private async downloadSingleFile(
		fileNode: FileNode,
	): Promise<{ filePath: string; fileName: string }> {
		if (!fileNode.fileBucketId) {
			throw new Error('File bucket ID not found');
		}

		const bucketDto = await this.bucketSv.getReadUrl(
			fileNode.fileBucketId as string,
		);
		const readUrl = bucketDto.readUrl;
		if (!readUrl) {
			throw new Error('Failed to get read URL');
		}

		const fileName = fileNode.name;
		const filePath = path.join(this.downloadDir, fileName);

		// Download file from bucket
		await this.downloadFileFromUrl(readUrl, filePath);

		return { filePath, fileName };
	}

	private async downloadFolderAsZip(
		folderNode: FileNode,
	): Promise<{ filePath: string; fileName: string }> {
		const zipFileName = `${folderNode.name}-${Date.now()}.zip`;
		const zipFilePath = path.join(this.downloadDir, zipFileName);

		// Get all descendants of the folder
		const descendants = await this.fileNodeRepo.findDescendants(folderNode);

		// Create zip archive
		const output = fs.createWriteStream(zipFilePath);
		const archive = archiver('zip', { zlib: { level: 9 } });

		return new Promise((resolve, reject) => {
			output.on('close', () => {
				this.logger.log(
					`Zip file created: ${zipFileName} (${archive.pointer()} bytes)`,
				);
				resolve({ filePath: zipFilePath, fileName: zipFileName });
			});

			archive.on('error', (err) => {
				this.logger.error(`Archive error: ${err.message}`);
				reject(err);
			});

			archive.pipe(output);

			// Add files to archive
			this.addFilesToArchive(
				archive,
				descendants,
				folderNode,
				folderNode.name,
			)
				.then(() => {
					archive.finalize();
				})
				.catch((err) => {
					archive.destroy();
					reject(err);
				});
		});
	}

	private async addFilesToArchive(
		archive: archiver.Archiver,
		descendants: FileNode[],
		rootFolder: FileNode,
		rootFolderName: string,
	): Promise<void> {
		// Create a map for quick lookup
		const nodeMap = new Map(descendants.map((n) => [n.id, n]));

		for (const node of descendants) {
			if (node.id === rootFolder.id) continue;

			if (node.type === TYPE_FILE_NODE.FILE && node.fileBucketId) {
				try {
					const bucketDto = await this.bucketSv.getReadUrl(
						node.fileBucketId as string,
					);
					const readUrl = bucketDto.readUrl;
					if (!readUrl) {
						throw new Error('Failed to get read URL');
					}

					const relativePath = this.getRelativePath(
						node,
						rootFolder,
						nodeMap,
					);

					// Add file to archive from URL with root folder prefix
					const fileBuffer = await this.downloadFileToBuffer(readUrl);
					const archivePath = `${rootFolderName}/${relativePath}`;
					archive.append(fileBuffer, { name: archivePath });
				} catch (err) {
					this.logger.warn(
						`Failed to add file ${node.name} to archive: ${err instanceof Error ? err.message : 'Unknown error'}`,
					);
				}
			} else if (node.type === TYPE_FILE_NODE.FOLDER) {
				const relativePath = this.getRelativePath(
					node,
					rootFolder,
					nodeMap,
				);
				const archivePath = `${rootFolderName}/${relativePath}`;
				archive.append(null, { name: `${archivePath}/` });
			}
		}
	}

	private getRelativePath(
		node: FileNode,
		rootFolder: FileNode,
		nodeMap?: Map<string, FileNode>,
	): string {
		// Build path from root folder to current node
		const pathParts: string[] = [];
		let current: FileNode | null = node;

		while (current && current.id !== rootFolder.id) {
			pathParts.unshift(current.name);
			if (current.fileNodeParentId && nodeMap) {
				current = nodeMap.get(current.fileNodeParentId) || null;
			} else {
				break;
			}
		}

		return pathParts.join('/');
	}

	private async downloadFileFromUrl(
		url: string,
		filePath: string,
	): Promise<void> {
		const buffer = await this.downloadFileToBuffer(url);
		fs.writeFileSync(filePath, buffer);
	}
	private async downloadFileToBuffer(url: string): Promise<Buffer> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download file: ${response.statusText}`);
		}
		return Buffer.from(await response.arrayBuffer());
	}

	async createZip(fileNodeId: string): Promise<{ path: string }> {
		const fileNode = await this.fileNodeRepo.findOne({
			where: { id: fileNodeId },
		});

		if (!fileNode) {
			throw new Error(`File node not found: ${fileNodeId}`);
		}

		// If it's a single file, create a zip with just that file
		if (fileNode.type === TYPE_FILE_NODE.FILE) {
			return this.createSingleFileZip(fileNode);
		}

		// If it's a folder, create a zip of all contents
		return this.createFolderZip(fileNode);
	}

	private async createSingleFileZip(
		fileNode: FileNode,
	): Promise<{ path: string }> {
		if (!fileNode.fileBucketId) {
			throw new Error('File bucket ID not found');
		}

		const zipFileName = `${fileNode.name}-${Date.now()}.zip`;
		const zipFilePath = path.join(this.downloadDir, zipFileName);

		const bucketDto = await this.bucketSv.getReadUrl(
			fileNode.fileBucketId as string,
		);
		const readUrl = bucketDto.readUrl;
		if (!readUrl) {
			throw new Error('Failed to get read URL');
		}

		const output = fs.createWriteStream(zipFilePath);
		const archive = archiver('zip', { zlib: { level: 9 } });

		return new Promise((resolve, reject) => {
			output.on('close', () => {
				this.logger.log(`Zip file created: ${zipFileName}`);
				resolve({ path: `/downloads/${zipFileName}` });
			});

			archive.on('error', (err) => {
				this.logger.error(`Archive error: ${err.message}`);
				reject(err);
			});

			archive.pipe(output);

			this.downloadFileToBuffer(readUrl)
				.then((buffer) => {
					archive.append(buffer, { name: fileNode.name });
					archive.finalize();
				})
				.catch((err) => {
					archive.destroy();
					reject(err);
				});
		});
	}

	private async createFolderZip(
		folderNode: FileNode,
	): Promise<{ path: string }> {
		const zipFileName = `${folderNode.name}-${Date.now()}.zip`;
		const zipFilePath = path.join(this.downloadDir, zipFileName);

		const descendants = await this.fileNodeRepo.findDescendants(folderNode);

		const output = fs.createWriteStream(zipFilePath);
		const archive = archiver('zip', { zlib: { level: 9 } });

		return new Promise((resolve, reject) => {
			output.on('close', () => {
				this.logger.log(`Zip file created: ${zipFileName}`);
				resolve({ path: `/downloads/${zipFileName}` });
			});

			archive.on('error', (err) => {
				this.logger.error(`Archive error: ${err.message}`);
				reject(err);
			});

			archive.pipe(output);

			this.addFilesToArchive(
				archive,
				descendants,
				folderNode,
				folderNode.name,
			)
				.then(() => {
					archive.finalize();
				})
				.catch((err) => {
					archive.destroy();
					reject(err);
				});
		});
	}

	async getDownloadPath(
		fileNodeId: string,
		filePath: string,
	): Promise<string> {
		// Validate that the file exists and belongs to the user
		const fileNode = await this.fileNodeRepo.findOne({
			where: { id: fileNodeId },
		});

		if (!fileNode) {
			throw new Error(`File node not found: ${fileNodeId}`);
		}

		// Prevent directory traversal attacks
		const normalizedPath = path.normalize(filePath);
		if (normalizedPath.includes('..')) {
			throw new Error('Invalid file path');
		}

		const fullPath = path.join(this.downloadDir, normalizedPath);

		// Verify the file exists
		if (!fs.existsSync(fullPath)) {
			throw new Error('Download file not found');
		}

		return fullPath;
	}

	@Cron(CronExpression.EVERY_HOUR)
	async cleanupOldFiles(maxAgeMs: number = 3600000): Promise<void> {
		// Clean up files older than 1 hour by default
		try {
			if (!fs.existsSync(this.downloadDir)) {
				return;
			}

			const now = Date.now();
			const files = fs.readdirSync(this.downloadDir);

			for (const file of files) {
				const filePath = path.join(this.downloadDir, file);
				const stats = fs.statSync(filePath);
				const fileAge = now - stats.mtimeMs;

				if (fileAge > maxAgeMs) {
					fs.unlinkSync(filePath);
					this.logger.log(`Deleted old download file: ${file}`);
				}
			}
		} catch (err) {
			this.logger.error(
				`Error cleaning up old files: ${err instanceof Error ? err.message : 'Unknown error'}`,
			);
		}
	}
}
