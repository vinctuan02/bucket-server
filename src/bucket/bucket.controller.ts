import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { BucketService } from './services/bucket.service';

@Controller('bucket')
export class BucketController {
  constructor(private readonly bucketService: BucketService) {}

  @Post('upload-link/:objectName')
  async getUploadLink(@Param('objectName') objectName: string) {
    const url = await this.bucketService.getUploadUrl(objectName);
    return { url };
  }

  @Get('read-link/:objectName')
  async getReadLink(@Param('objectName') objectName: string) {
    const url = await this.bucketService.getReadUrl(objectName);
    return { url };
  }

  @Delete(':objectName')
  async deleteFile(@Param('objectName') objectName: string) {
    await this.bucketService.deleteFile(objectName);
    return { message: `Deleted ${objectName}` };
  }
}
