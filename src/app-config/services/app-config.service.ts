import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadPurpose } from 'src/bucket/enum/bucket.enum';
import { BucketService } from 'src/bucket/services/bucket.service';
import { Repository } from 'typeorm';
import { AppConfig } from '../app-config.entity';
import { DEFAULT_TRASH_RETENTION_DAYS } from '../const/app-config.const';
import {
	AppConfigResponseDto,
	UpdateAppConfigDto,
} from '../dto/app-config.dto';
import { AppConfigKey } from '../enum/app-config.enum';

@Injectable()
export class AppConfigService {
	private readonly logger = new Logger(AppConfigService.name);

	constructor(
		@InjectRepository(AppConfig)
		private readonly appConfigRepo: Repository<AppConfig>,
		private readonly bucketService: BucketService,
		private readonly configService: ConfigService,
	) {}

	async getConfig(): Promise<AppConfigResponseDto> {
		const configs = await this.appConfigRepo.find({
			where: [
				{ key: AppConfigKey.TRASH_RETENTION_DAYS },
				{ key: AppConfigKey.ICON },
			],
		});

		const trashConfig = configs.find(
			(c) => c.key === AppConfigKey.TRASH_RETENTION_DAYS,
		);
		const iconConfig = configs.find((c) => c.key === AppConfigKey.ICON);

		const trashRetentionDays = trashConfig
			? parseInt(trashConfig.value, 10)
			: DEFAULT_TRASH_RETENTION_DAYS;

		const icon = iconConfig ? iconConfig.value : null;

		return { trashRetentionDays, icon };
	}

	async updateConfig(dto: UpdateAppConfigDto): Promise<AppConfigResponseDto> {
		// Update trash retention days
		let trashConfig = await this.appConfigRepo.findOne({
			where: { key: AppConfigKey.TRASH_RETENTION_DAYS },
		});

		if (trashConfig) {
			trashConfig.value = dto.trashRetentionDays.toString();
			await this.appConfigRepo.save(trashConfig);
		} else {
			trashConfig = this.appConfigRepo.create({
				key: AppConfigKey.TRASH_RETENTION_DAYS,
				value: dto.trashRetentionDays.toString(),
				type: 'number',
				description:
					'Number of days before files are permanently deleted from trash',
			});
			await this.appConfigRepo.save(trashConfig);
		}

		// Update icon if provided
		if (dto.icon !== undefined) {
			let iconConfig = await this.appConfigRepo.findOne({
				where: { key: AppConfigKey.ICON },
			});

			if (iconConfig) {
				iconConfig.value = dto.icon || '';
				await this.appConfigRepo.save(iconConfig);
			} else if (dto.icon) {
				iconConfig = this.appConfigRepo.create({
					key: AppConfigKey.ICON,
					value: dto.icon,
					type: 'string',
					description: 'Website icon URL',
				});
				await this.appConfigRepo.save(iconConfig);
			}
		}

		return await this.getConfig();
	}

	async initializeDefaultConfig(): Promise<void> {
		const existing = await this.appConfigRepo.findOne({
			where: { key: AppConfigKey.TRASH_RETENTION_DAYS },
		});

		if (!existing) {
			const config = this.appConfigRepo.create({
				key: AppConfigKey.TRASH_RETENTION_DAYS,
				value: DEFAULT_TRASH_RETENTION_DAYS.toString(),
				type: 'number',
				description:
					'Number of days before files are permanently deleted from trash',
			});
			await this.appConfigRepo.save(config);
			this.logger.log('Default app config initialized');
		}
	}

	async getIconUploadUrl(fileMetadata: {
		fileName: string;
		fileSize: number;
		contentType: string;
	}): Promise<{ uploadUrl: string; iconUrl: string }> {
		const { fileName, fileSize, contentType } = fileMetadata;

		// Get upload URL for public bucket
		const { uploadUrl, key } = await this.bucketService.getUploadUrl({
			fileName,
			fileSize,
			contentType,
			extension: fileName.split('.').pop() || '',
			folderBucket: { uploadPurpose: UploadPurpose.CASE_1 },
			isPublic: true,
		});

		// Construct public URL
		const minioEndpoint = this.configService.get<string>('MINIO_HOST');
		const minioPort = this.configService.get<string>('MINIO_PORT');
		const bucketName = 'public';

		const iconUrl = `http://${minioEndpoint}:${minioPort}/${bucketName}/${key}`;

		return {
			uploadUrl: uploadUrl ?? '',
			iconUrl,
		};
	}
}
