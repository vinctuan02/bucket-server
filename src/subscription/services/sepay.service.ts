import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SePayService {
	private readonly logger = new Logger(SePayService.name);

	constructor(private configService: ConfigService) {
		this.logger.log('SePay Service initialized (Mock Mode)');
	}

	/**
	 * Mock payment - tạo URL giả để test
	 */
	async createPayment(orderId: string, amount: number) {
		this.logger.log(
			`Creating mock payment for orderId: ${orderId}, amount: ${amount}`,
		);

		// Tạo mock checkout URL - redirect về success page luôn
		const mockCheckoutUrl = `${this.configService.get<string>('SEPAY_SUCCESS_URL', 'http://localhost:3001/payment/success')}?orderId=${orderId}&amount=${amount}`;

		return {
			checkoutUrl: mockCheckoutUrl,
			checkoutFields: {
				orderId,
				amount,
				status: 'PENDING',
			},
			qrCodeData: '',
			description: `Thanh toan ${orderId}`,
			bankInfo: {
				bankName: 'Mock Bank',
				accountNumber: '1234567890',
				accountName: 'Test Account',
			},
		};
	}

	/**
	 * Mock webhook verification - luôn trả về true để test
	 */
	verifyWebhookSignature(
		fields: Record<string, any>,
		signature: string,
	): boolean {
		this.logger.log('Mock webhook verification - always returns true');
		return true;
	}
}
