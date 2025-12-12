import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AnalyticsTrackingService } from '../services/analytics-tracking.service';

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
	constructor(private readonly analyticsService: AnalyticsTrackingService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();

		const { method, url, user, ip, headers } = request;
		const userAgent = headers['user-agent'];

		return next.handle().pipe(
			tap(async (data) => {
				try {
					// Track different types of events based on the endpoint
					if (
						method === 'POST' &&
						url.includes('/file-node') &&
						!url.includes('/folder')
					) {
						// File upload
						if (data && data.id) {
							await this.analyticsService.trackFileUpload(
								user?.id,
								data.id,
								data.size || 0,
								{ endpoint: url, method },
							);
						}
					} else if (
						method === 'GET' &&
						url.includes('/file-node/') &&
						url.includes('/download')
					) {
						// File download
						const fileId = this.extractFileIdFromUrl(url);
						if (fileId) {
							await this.analyticsService.trackFileDownload(
								user?.id,
								fileId,
								0, // Size would need to be determined from the file
								ip,
								userAgent,
							);
						}
					} else if (
						method === 'POST' &&
						url.includes('/share-link')
					) {
						// File share
						if (data && data.fileNodeId) {
							await this.analyticsService.trackFileShare(
								user?.id,
								data.fileNodeId,
							);
						}
					} else if (
						method === 'POST' &&
						url.includes('/auth/login')
					) {
						// User login
						if (user?.id) {
							await this.analyticsService.trackUserLogin(
								user.id,
								ip,
								userAgent,
							);
						}
					}
				} catch (error) {
					// Don't let analytics errors affect the main request
					console.error('Analytics tracking error:', error);
				}
			}),
		);
	}

	private extractFileIdFromUrl(url: string): string | null {
		const matches = url.match(/\/file-node\/([a-f0-9-]+)/);
		return matches ? matches[1] : null;
	}
}
