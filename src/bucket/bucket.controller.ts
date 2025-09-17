import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
} from '@nestjs/common';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { GetListFileBucketDto, GetUploadUrlDto } from './dto/bucket.dto';
import { BucketService } from './services/bucket.service';

@Controller('bucket')
export class BucketController {
	constructor(private readonly bucketService: BucketService) {}

	@Post()
	async getUploadUrl(@Body() body: GetUploadUrlDto) {
		const data = await this.bucketService.getUploadUrl(body);
		return new ResponseSuccess({ data });
	}

	@Get()
	async getList(@Query() query: GetListFileBucketDto) {
		const data = await this.bucketService.getList(query);
		return new ResponseSuccess({ data });
	}

	@Get(':id/read')
	async getReadUrl(@Param('id') id: string) {
		const data = await this.bucketService.getReadUrl(id);
		return new ResponseSuccess({ data });
	}

	@Get(':id/download')
	async getDownUrl(@Param('id') id: string) {
		const data = await this.bucketService.getDownUrl(id);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		await this.bucketService.delete(id);
		return new ResponseSuccess({
			message: 'Delete file on bucket successfully',
		});
	}
}
