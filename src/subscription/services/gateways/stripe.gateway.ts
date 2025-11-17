import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { PaymentMethod } from '../../enum/subscription.enum';
import {
	PaymentGatewayService,
	PaymentRequest,
	PaymentResponse,
	WebhookPayload,
} from '../payment-gateway.service';

/**
 * Stripe Payment Gateway Implementation
 * Reference: https://stripe.com/docs
 *
 * Note: This is a template implementation. In production, install stripe package:
 * npm install stripe
 */
@Injectable()
export class StripeGateway extends PaymentGatewayService {
	method = PaymentMethod.VISA;
	private webhookSecret: string;

	constructor(private configService: ConfigService) {
		super();
		this.webhookSecret =
			this.configService.get('STRIPE_WEBHOOK_SECRET') || '';
	}

	async createPayment(_request: PaymentRequest): Promise<PaymentResponse> {
		try {
			// In production, use actual Stripe SDK:
			// const session = await this.stripe.checkout.sessions.create({...});
			// For now, return mock response
			const sessionId = `cs_${Date.now()}`;

			return await Promise.resolve({
				paymentGatewayId: sessionId,
				redirectUrl: `https://checkout.stripe.com/pay/${sessionId}`,
			});
		} catch (_error) {
			throw new ResponseError({
				message: 'Failed to create Stripe payment',
			});
		}
	}

	verifyWebhookSignature(
		_payload: Record<string, any>,
		_signature: string,
	): boolean {
		try {
			// In production, use actual Stripe SDK:
			// const event = this.stripe.webhooks.constructEvent(...);
			// For now, always return true for testing
			return true;
		} catch (_error) {
			return false;
		}
	}

	parseWebhookPayload(payload: Record<string, any>): WebhookPayload {
		// In production, parse actual Stripe event
		let status: 'success' | 'failed' | 'pending' = 'pending';
		let paymentGatewayId = '';
		let transactionRef = '';

		if (payload.type === 'checkout.session.completed') {
			status = 'success';
			paymentGatewayId = payload.data?.object?.id || '';
			transactionRef =
				payload.data?.object?.metadata?.transactionId || '';
		} else if (payload.type === 'charge.failed') {
			status = 'failed';
			paymentGatewayId = payload.data?.object?.id || '';
			transactionRef =
				payload.data?.object?.metadata?.transactionId || '';
		}

		return {
			transactionRef,
			paymentGatewayId,
			status,
			paidAt: new Date(),
			rawData: payload,
		};
	}
}
