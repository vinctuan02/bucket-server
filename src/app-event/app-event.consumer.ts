import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FileManagerService } from 'src/file-node/file-node.service';
import { AppEventType } from './enum/app-event.enum';

@Injectable()
export class AppEventConsumer {
	private readonly logger = new Logger(AppEventConsumer.name);
	constructor(private readonly fileManagerSv: FileManagerService) {}

	@OnEvent(AppEventType.USER_CREATED)
	async handleUserCreatedEvent(userId: string) {
		this.logger.verbose('AppEventType.USER_CREATED: ', userId);

		try {
			await this.fileManagerSv.createRootFolder(userId);
		} catch (error) {
			this.logger.error(error.message);
		}
	}
}
