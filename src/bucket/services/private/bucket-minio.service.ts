import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { ObjectFileBucket } from 'src/bucket/dto/bucket.dto';

@Injectable()
export class BucketMinioService {
	private readonly logger = new Logger(BucketMinioService.name);
	private readonly minioClient: Client;

	constructor(private readonly configService: ConfigService) {
		this.minioClient = new Client({
			endPoint: this.configService.get<string>('MINIO_HOST')!,
			port: Number(this.configService.get<string>('MINIO_PORT')),
			useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
			accessKey: this.configService.get<string>('MINIO_ACCESS_KEY')!,
			secretKey: this.configService.get<string>('MINIO_SECRET_KEY')!,
		});
	}

	async getUploadUrl({ bucket, key, expiry }: ObjectFileBucket) {
		return this.minioClient.presignedPutObject(bucket, key, expiry);
	}

	async getReadUrlSafe(input: ObjectFileBucket) {
		try {
			return await this.getReadUrl(input);
		} catch (e) {
			this.logger.warn(`getReadUrlSafe failed: ${e.message}`);
			return '';
		}
	}

	async getReadUrl({ bucket, key, expiry }: ObjectFileBucket) {
		return this.minioClient.presignedGetObject(bucket, key, expiry);
	}

	async downloadFile({ bucket, key }: ObjectFileBucket) {
		return this.minioClient.getObject(bucket, key);
	}

	async deleteFile({ bucket, key }: ObjectFileBucket) {
		return this.minioClient.removeObject(bucket, key);
	}
}
