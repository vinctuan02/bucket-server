import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { EmailProvider } from './services/email.provider';
import { NotificationHelperService } from './services/notification.helper.service';
import { NotificationService } from './services/notification.service';

@Module({
	imports: [TypeOrmModule.forFeature([User])],
	providers: [NotificationHelperService, EmailProvider, NotificationService],
	exports: [NotificationService],
})
export class NotificationModule {}
