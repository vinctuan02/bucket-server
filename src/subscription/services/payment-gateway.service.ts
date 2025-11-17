import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../enum/subscription.enum';

export interface PaymentRequest {
	transactionId: string;
	amount: number;
	currency: string;
	description: string;
	returnUrl: string;
	notifyUrl: string;
}

export interface PaymentResponse {
	paymentGatewayId: string;
	redirectUrl: string;
	expiresAt?: Date;
}

export interface WebhookPayload {
	transactionRef: string;
	paymentGatewayId: string;
	status: 'success' | 'failed' | 'pending';
	amount?: number;
	paidAt?: Date;
	rawData?: Record<string, any>;
}

/**
 * Abstract base class for payment gateway implementations
 * Each gateway (Momo, Stripe, PayPal, etc.) should extend this
 */
@Injectable()
export abstract class PaymentGatewayService {
	abstract method: PaymentMethod;

	/**
	 * Create payment request and return redirect URL
	 */
	abstract createPayment(request: PaymentRequest): Promise<PaymentResponse>;

	/**
	 * Verify webhook signature from gateway
	 */
	abstract verifyWebhookSignature(
		payload: Record<string, any>,
		signature: string,
	): boolean;

	/**
	 * Parse webhook payload from gateway
	 */
	abstract parseWebhookPayload(payload: Record<string, any>): WebhookPayload;

	/**
	 * Refund payment (optional)
	 */
	async refund?(transactionId: string, amount: number): Promise<boolean> {
		throw new Error('Refund not implemented for this gateway');
	}
}
