import { Body, Controller, Get, Post } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import type { CurrentUser } from 'src/common/interface/common.interface';
import {
	CreateSubscriptionDto,
	SubscriptionResponseDto,
} from '../dto/subscription.dto';
import { SubscriptionService } from '../services/subscription.service';

@ApiTags('Subscription - Subscriptions')
@ApiBearerAuth()
@Controller('subscription/subscriptions')
export class SubscriptionController {
	constructor(private readonly service: SubscriptionService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new subscription for user' })
	@ApiBody({ type: CreateSubscriptionDto })
	@ApiResponse({
		status: 201,
		description: 'Subscription created successfully',
		type: SubscriptionResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Plan not found' })
	async create(
		@User() user: CurrentUser,
		@Body() dto: CreateSubscriptionDto,
	) {
		const data = await this.service.create(user.userId, dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	@ApiOperation({ summary: 'Get all subscriptions for current user' })
	@ApiResponse({
		status: 200,
		description: 'List of user subscriptions',
		type: [SubscriptionResponseDto],
	})
	async findByUser(@User() user: CurrentUser) {
		const data = await this.service.findByUserId(user.userId);
		return new ResponseSuccess({ data });
	}

	@Get('active')
	@ApiOperation({ summary: 'Get active subscription for current user' })
	@ApiResponse({
		status: 200,
		description: 'Active subscription details',
		type: SubscriptionResponseDto,
	})
	@ApiResponse({ status: 404, description: 'No active subscription found' })
	async findActive(@User() user: CurrentUser) {
		const data = await this.service.findActiveByUserId(user.userId);
		return new ResponseSuccess({ data });
	}
}
