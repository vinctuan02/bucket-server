import { SetMetadata } from '@nestjs/common';
import { AnalyticsEventType } from '../entities/analytics-event.entity';

export const ANALYTICS_EVENT_KEY = 'analytics_event';

export interface AnalyticsEventConfig {
	eventType: AnalyticsEventType;
	extractData?: (
		result: any,
		request: any,
	) => {
		userId?: string;
		fileNodeId?: string;
		bytesTransferred?: number;
		metadata?: Record<string, any>;
	};
}

export const TrackAnalytics = (config: AnalyticsEventConfig) =>
	SetMetadata(ANALYTICS_EVENT_KEY, config);
