import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import type { CurrentUser } from 'src/common/interface/common.interface';
import {
	CreateTransactionDto,
	TransactionResponseDto,
	UpdateTransactionStatusDto,
} from '../dto/transaction.dto';
import { PaymentService } from '../services/payment.service';
import { TransactionService } from '../services/transaction.service';

@ApiTags('Subscription - Transactions')
@ApiBearerAuth()
@Controller('subscription/transactions')
export class TransactionController {
	constructor(
		private readonly service: TransactionService,
		private readonly paymentService: PaymentService,
	) {}

	@Post()
	@ApiOperation({ summary: 'Create a new transaction' })
	@ApiBody({ type: CreateTransactionDto })
	@ApiResponse({
		status: 201,
		description: 'Transaction created successfully',
		type: TransactionResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Subscription not found' })
	async create(@User() user: CurrentUser, @Body() dto: CreateTransactionDto) {
		const data = await this.service.create(user.userId, dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	@ApiOperation({ summary: 'Get all transactions for current user' })
	@ApiResponse({
		status: 200,
		description: 'List of user transactions',
		type: [TransactionResponseDto],
	})
	async findByUser(@User() user: CurrentUser) {
		const data = await this.service.findByUserId(user.userId);
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get transaction by ID' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Transaction ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'Transaction details',
		type: TransactionResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Transaction not found' })
	async findById(@Param('id') id: string) {
		const data = await this.service.findById(id);
		return new ResponseSuccess({ data });
	}

	@Put(':id/status')
	@ApiOperation({ summary: 'Update transaction status' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Transaction ID (UUID)',
	})
	@ApiBody({ type: UpdateTransactionStatusDto })
	@ApiResponse({
		status: 200,
		description: 'Transaction status updated',
		type: TransactionResponseDto,
	})
	async updateStatus(
		@Param('id') id: string,
		@Body() dto: UpdateTransactionStatusDto,
	) {
		const data = await this.service.updateStatus(id, dto);
		return new ResponseSuccess({ data });
	}

	@Post(':id/confirm')
	@ApiOperation({ summary: 'Confirm payment - mark transaction as success' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Transaction ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'Payment confirmed, subscription activated',
		type: TransactionResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Transaction not found' })
	async confirm(@Param('id') id: string) {
		const data = await this.service.confirm(id);
		return new ResponseSuccess({ data });
	}

	@Post(':id/fail')
	@ApiOperation({ summary: 'Mark transaction as failed' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Transaction ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'Transaction marked as failed',
		type: TransactionResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Transaction not found' })
	async fail(@Param('id') id: string) {
		const data = await this.service.fail(id);
		return new ResponseSuccess({ data });
	}

	@Post(':id/create-payment')
	@ApiOperation({ summary: 'Create payment request with gateway' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Transaction ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'Payment request created',
		schema: {
			properties: {
				redirectUrl: { type: 'string' },
				expiresAt: { type: 'string', format: 'date-time' },
			},
		},
	})
	@ApiResponse({ status: 404, description: 'Transaction not found' })
	async createPayment(@Param('id') id: string, @Req() req: any) {
		const transaction = await this.service.findById(id);
		const baseUrl = `${req.protocol}://${req.get('host')}`;

		const paymentResponse = await this.paymentService.createPayment(
			transaction.paymentMethod as any,
			{
				transactionId: transaction.id,
				amount: Number(transaction.amount),
				currency: transaction.currency,
				description: `Payment for subscription`,
				returnUrl: `${baseUrl}/subscription/payment-result?transactionId=${transaction.id}`,
				notifyUrl: `${baseUrl}/subscription/webhooks/${transaction.paymentMethod}`,
			},
		);

		// Save payment gateway ID
		await this.service.updateStatus(id, {
			status: transaction.status,
			paymentGatewayId: paymentResponse.paymentGatewayId,
		});

		return new ResponseSuccess({ data: paymentResponse });
	}
}
