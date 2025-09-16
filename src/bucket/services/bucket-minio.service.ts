import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class BucketMinioService {
  private readonly logger = new Logger(BucketMinioService.name);
  private readonly minioClient: Client;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    this.minioClient = new Client({
      endPoint: this.configService.get<string>('MINIO_HOST')!,
      port: Number(this.configService.get<string>('MINIO_PORT')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
    });

    this.bucket = this.configService.get<string>('MINIO_BUCKET')!;
  }

  async getUploadUrl(key: string) {
    return this.minioClient.presignedPutObject(this.bucket);
  }

  async getReadUrl(objectName: string, expiry = 60) {
    return this.minioClient.presignedGetObject(this.bucket, objectName, expiry);
  }

  async downloadFile(objectName: string) {
    return this.minioClient.getObject(this.bucket, objectName);
  }

  async deleteFile(objectName: string) {
    return this.minioClient.removeObject(this.bucket, objectName);
  }
}
