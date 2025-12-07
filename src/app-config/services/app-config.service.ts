import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
	) {}

	async getConfig(): Promise<AppConfigResponseDto> {
		const config = await this.appConfigRepo.findOne({
			where: { key: AppConfigKey.TRASH_RETENTION_DAYS },
		});

		const trashRetentionDays = config
			? parseInt(config.value, 10)
			: DEFAULT_TRASH_RETENTION_DAYS;

		return { trashRetentionDays };
	}

	async updateConfig(dto: UpdateAppConfigDto): Promise<AppConfigResponseDto> {
		let config = await this.appConfigRepo.findOne({
			where: { key: AppConfigKey.TRASH_RETENTION_DAYS },
		});

		if (config) {
			config.value = dto.trashRetentionDays.toString();
			await this.appConfigRepo.save(config);
		} else {
			config = this.appConfigRepo.create({
				key: AppConfigKey.TRASH_RETENTION_DAYS,
				value: dto.trashRetentionDays.toString(),
				type: 'number',
				description:
					'Number of days before files are permanently deleted from trash',
			});
			await this.appConfigRepo.save(config);
		}

		return { trashRetentionDays: dto.trashRetentionDays };
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
}
