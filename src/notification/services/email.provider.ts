// src/notification/email.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class EmailProvider {
	private logger = new Logger(EmailProvider.name);
	private transporter;

	constructor(private configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			service: this.configService.get<string>('MAIL_SERVICE', 'gmail'),
			auth: {
				user: this.configService.get<string>('MAIL_USER'),
				pass: this.configService.get<string>('MAIL_PASS'),
			},
		});
	}

	async sendMail(data: { to: User['email']; subject: string; html: string }) {
		const { to, subject, html } = data;

		try {
			await this.transporter.sendMail({
				from: process.env.MAIL_USER,
				to,
				subject,
				html,
			});
			// this.logger.log(`Email sent to ${to}`);
		} catch (error) {
			this.logger.error('Failed to send email', error);
			throw error;
		}
	}
}
