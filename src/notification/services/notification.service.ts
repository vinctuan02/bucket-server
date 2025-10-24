import { Injectable } from '@nestjs/common';
import { EmailProvider } from './email.provider';
import { NotificationHelperService } from './notification.helper.service';

@Injectable()
export class NotificationService {
	constructor(
		private readonly notificationHelperService: NotificationHelperService,
		private readonly emailProvider: EmailProvider,
	) {}

	async sendEmailAccountVerification({
		recipientId,
		code,
	}: {
		recipientId: string;
		code: string;
	}) {
		const recipient =
			await this.notificationHelperService.getUser(recipientId);

		const { subject, html } =
			this.notificationHelperService.getAccountVerificationTemplate(code);

		await this.emailProvider.sendMail({
			to: recipient.email,
			subject,
			html,
		});
	}
}
