// public-share.controller.ts
import { Injectable } from '@nestjs/common';
import { GetlistFileNodeDto } from 'src/file-node/dto/file-node.dto';
import { FileManagerService } from 'src/file-node/file-node.service';
import { ShareLinkService } from 'src/share-link/share-link.service';

@Injectable()
export class PublicShareService {
	constructor(
		private readonly shareLinkService: ShareLinkService,
		private readonly fileManagerService: FileManagerService,
	) {}

	async getShared(token: string) {
		const share = await this.shareLinkService.findByToken(token);

		const data = await this.fileManagerService.getChildrens({
			id: share.fileNodeId,
			filter: new GetlistFileNodeDto(),
		});

		return {
			...data,
			permissions: {
				canView: share.canView,
				canEdit: share.canEdit,
				canDownload: share.canDownload,
			},
		};
	}
}
