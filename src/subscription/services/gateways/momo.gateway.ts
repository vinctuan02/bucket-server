import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { PaymentMethod } from '../../enum/subscription.enum';
import {
	PaymentGatewayService,
	PaymentRequest,
	PaymentResponse,
	WebhookPayload,
} from '../payment-gateway.service';

/**
 * Momo Payment Gateway Implementation
 * Reference: https://developers.momo.vn/
 */
@Injectable()
export class MomoGateway extends PaymentGatewayService {
	method = PaymentMethod.MOMO;
	private partnerCode: string;
	private accessKey: string;
	private secretKey: string;
	private endpoint: string;

	constructor(private configService: ConfigService) {
		super();
		this.partnerCode = this.configService.get('MOMO_PARTNER_CODE') || '';
		this.accessKey = this.configService.get('MOMO_ACCESS_KEY') || '';
		this.secretKey = this.configService.get('MOMO_SECRET_KEY') || '';
		this.endpoint =
			this.configService.get('MOMO_ENDPOINT') ||
			'https://test-payment.momo.vn/v2/gateway/api/create';
	}

	async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
		const requestId = `${this.partnerCode}${Date.now()}`;
		const orderId = request.transactionId;
		const amount = Math.round(request.amount);
		const orderInfo = request.description;
		const redirectUrl = request.returnUrl;
		const ipnUrl = request.notifyUrl;

		// Create signature
		const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
		const signature = crypto
			.createHmac('sha256', this.secretKey)
			.update(rawSignature)
			.digest('hex');

		const _payload = {
			partnerCode: this.partnerCode,
			partnerName: 'Bucket',
			storeId: 'MomoTestStore',
			requestId,
			amount,
			orderId,
			orderInfo,
			redirectUrl,
			ipnUrl,
			lang: 'vi',
			requestType: 'captureWallet',
			autoCapture: true,
			extraData: '',
			signature,
		};

		try {
			// In production, make actual HTTP request to Momo API
			// const response = await fetch(this.endpoint, { method: 'POST', body: JSON.stringify(_payload) });
			// const data = await response.json();

			// For now, return mock response
			return await Promise.resolve({
				paymentGatewayId: requestId,
				redirectUrl: `https://test-payment.momo.vn/web/index.html?token=${requestId}`,
				expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
			});
		} catch (_error) {
			throw new ResponseError({
				message: 'Failed to create Momo payment',
			});
		}
	}

	verifyWebhookSignature(
		payload: Record<string, any>,
		signature: string,
	): boolean {
		const rawSignature = `accessKey=${this.accessKey}&amount=${payload.amount}&extraData=${payload.extraData || ''}&ipnUrl=${payload.ipnUrl || ''}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&partnerCode=${this.partnerCode}&requestId=${payload.requestId}&requestType=${payload.requestType}`;

		const computedSignature = crypto
			.createHmac('sha256', this.secretKey)
			.update(rawSignature)
			.digest('hex');

		return computedSignature === signature;
	}

	parseWebhookPayload(payload: Record<string, any>): WebhookPayload {
		return {
			transactionRef: payload.orderId,
			paymentGatewayId: payload.requestId,
			status: payload.resultCode === 0 ? 'success' : 'failed',
			amount: payload.amount,
			paidAt: new Date(),
			rawData: payload,
		};
	}
}
