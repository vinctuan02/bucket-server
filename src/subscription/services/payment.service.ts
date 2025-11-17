import { Injectable } from '@nestjs/common';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { PaymentMethod } from '../enum/subscription.enum';
import {
	PaymentGatewayService,
	PaymentRequest,
	PaymentResponse,
	WebhookPayload,
} from './payment-gateway.service';

@Injectable()
export class PaymentService {
	private gateways: Map<PaymentMethod, PaymentGatewayService> = new Map();

	/**
	 * Register a payment gateway
	 */
	registerGateway(
		method: PaymentMethod,
		gateway: PaymentGatewayService,
	): void {
		this.gateways.set(method, gateway);
	}

	/**
	 * Get gateway by payment method
	 */
	private getGateway(method: PaymentMethod): PaymentGatewayService {
		const gateway = this.gateways.get(method);

		if (!gateway) {
			throw new ResponseError({
				message: `Payment gateway '${method}' not configured`,
			});
		}

		return gateway;
	}

	/**
	 * Create payment request
	 */
	async createPayment(
		method: PaymentMethod,
		request: PaymentRequest,
	): Promise<PaymentResponse> {
		const gateway = this.getGateway(method);
		return gateway.createPayment(request);
	}

	/**
	 * Verify webhook signature
	 */
	verifyWebhookSignature(
		method: PaymentMethod,
		payload: Record<string, any>,
		signature: string,
	): boolean {
		const gateway = this.getGateway(method);
		return gateway.verifyWebhookSignature(payload, signature);
	}

	/**
	 * Parse webhook payload
	 */
	parseWebhookPayload(
		method: PaymentMethod,
		payload: Record<string, any>,
	): WebhookPayload {
		const gateway = this.getGateway(method);
		return gateway.parseWebhookPayload(payload);
	}
}
