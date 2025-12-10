import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/common/decorators/common.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import type { CurrentUser } from 'src/common/interface/common.interface';
import { CheckoutDto } from '../dto/payment.dto';
import { TransactionDetailDto } from '../dto/transaction-detail.dto';
import { PaymentService } from '../services/payment.service';

@ApiTags('Subscription - Payment')
@ApiBearerAuth()
@Controller('subscription/payment')
export class PaymentController {
	constructor(private readonly paymentService: PaymentService) {}

	/**
	 * Initiate payment checkout
	 * Creates Transaction and Subscription, returns payment URL
	 */
	@Post('checkout')
	@ApiOperation({ summary: 'Initiate payment checkout' })
	async checkout(@User() user: CurrentUser, @Body() dto: CheckoutDto) {
		return this.paymentService.initiateCheckout(user.userId, dto.planId);
	}

	/**
	 * Check payment status (for frontend polling)
	 */
	@Get('status/:transactionId')
	@ApiOperation({ summary: 'Check payment status' })
	async checkStatus(@Param('transactionId') transactionId: string) {
		return this.paymentService.checkPaymentStatus(transactionId);
	}

	/**
	 * Get detailed transaction information by transaction ID
	 *
	 * @param user - Current authenticated user
	 * @param transactionId - UUID of the transaction to retrieve
	 * @returns Complete transaction details including subscription and plan information
	 * @throws 400 - Invalid transaction ID format
	 * @throws 403 - Access denied (user can only view their own transactions)
	 * @throws 404 - Transaction not found
	 */
	@Get('detail/:transactionId')
	@ApiOperation({
		summary: 'Get transaction detail by ID',
		description:
			'Retrieve complete transaction information including payment details, subscription info, and plan details. Users can only access their own transactions.',
	})
	@ApiResponse({
		status: 200,
		description: 'Transaction details retrieved successfully',
		type: TransactionDetailDto,
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid transaction ID format',
	})
	@ApiResponse({
		status: 403,
		description:
			'Access denied - user can only view their own transactions',
	})
	@ApiResponse({
		status: 404,
		description: 'Transaction not found',
	})
	async getTransactionDetail(
		@User() user: CurrentUser,
		@Param('transactionId') transactionId: string,
	) {
		try {
			const data = await this.paymentService.getTransactionDetail(
				transactionId,
				user.userId,
			);
			return new ResponseSuccess({ data });
		} catch (error) {
			// Log error for debugging
			console.error(
				`Error getting transaction detail ${transactionId}:`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Get user's transaction history
	 */
	@Get('history')
	@ApiOperation({ summary: 'Get user transaction history' })
	async getTransactionHistory(@User() user: CurrentUser) {
		const data = await this.paymentService.getTransactionHistory(
			user.userId,
		);
		return new ResponseSuccess({ data });
	}
}
