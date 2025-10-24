import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationHelperService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
	) {}

	async getUser(id: string): Promise<User> {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) throw new ResponseError({ message: `User ${id} not found` });
		return user;
	}

	getAccountVerificationTemplate(code: string): {
		subject: string;
		html: string;
	} {
		const subject = 'Verify Your CloudBox Account';
		const html = `
			<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
				<h2 style="color: #4a90e2;">Welcome to CloudBox!</h2>
				<p>Thank you for signing up. To complete your registration, please verify your account using the verification code below:</p>
				<p style="font-size: 24px; font-weight: bold; color: #4a90e2; letter-spacing: 3px;">${code}</p>
				<p>If you didn’t request this email, please ignore it.</p>
				<br/>
				<p>Best regards,<br/><strong>The CloudBox Team</strong></p>
			</div>
		`;
		return { subject, html };
	}
}
