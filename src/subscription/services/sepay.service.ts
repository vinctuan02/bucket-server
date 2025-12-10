import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SepayService {
	private readonly logger = new Logger(SepayService.name);
	private readonly BASE_URL: string;
	private readonly MERCHANT_ID: string;
	private readonly SECRET_KEY: string;
	private readonly CALLBACK_URL: string;
	private readonly RETURN_URL: string;

	private readonly CHECKOUT_URL =
		'https://pay-sandbox.sepay.vn/v1/checkout/init';
	private readonly SUCCESS_URL: string;
	private readonly ERROR_URL: string;
	private readonly CANCEL_URL: string;

	constructor(private readonly configService: ConfigService) {
		// Load configuration from environment variables
		this.BASE_URL = this.configService.get<string>('SEPAY_BASE_URL', '');
		this.MERCHANT_ID = this.configService.get<string>(
			'SEPAY_MERCHANT_ID',
			'',
		);
		this.SECRET_KEY = this.configService.get<string>(
			'SEPAY_SECRET_KEY',
			'',
		);
		this.CALLBACK_URL = this.configService.get<string>(
			'SEPAY_CALLBACK_URL',
			'',
		);
		this.RETURN_URL = this.configService.get<string>(
			'SEPAY_RETURN_URL',
			'',
		);

		// Validate required configuration
		if (
			!this.BASE_URL ||
			!this.MERCHANT_ID ||
			!this.SECRET_KEY ||
			!this.CALLBACK_URL ||
			!this.RETURN_URL
		) {
			throw new Error(
				'Sepay configuration variables are missing. Please check SEPAY_MERCHANT_ID, SEPAY_SECRET_KEY, SEPAY_BASE_URL, SEPAY_CALLBACK_URL, SEPAY_RETURN_URL',
			);
		}

		this.logger.log('SepayService initialized successfully');
		this.SUCCESS_URL = this.configService.get('SEPAY_SUCCESS_URL') ?? '';
		this.ERROR_URL = this.configService.get('SEPAY_ERROR_URL') ?? '';
		this.CANCEL_URL = this.configService.get('SEPAY_CANCEL_URL') ?? '';
	}

	/**
	 * Create Basic Authentication header
	 * Format: Basic Base64(merchant_id:secret_key)
	 */
	private createBasicAuthHeader(): string {
		const authString = `${this.MERCHANT_ID}:${this.SECRET_KEY}`;
		const base64String = Buffer.from(authString).toString('base64');
		return `Basic ${base64String}`;
	}

	/**
	 * Create HMAC-SHA256 signature for request payload
	 * Steps:
	 * 1. Collect all params except 'signature' and 'checksum'
	 * 2. Sort keys alphabetically
	 * 3. Concatenate values in sorted order
	 * 4. Append SECRET_KEY
	 * 5. Compute HMAC-SHA256 hash
	 */
	// public createSignature(params: Record<string, any>): string {
	// 	// Step 1 & 2: Collect and sort keys
	// 	const sortedKeys = Object.keys(params)
	// 		.filter((key) => key !== 'signature' && key !== 'checksum')
	// 		.sort();

	// 	// Step 3: Concatenate values
	// 	let dataString = '';
	// 	for (const key of sortedKeys) {
	// 		dataString += params[key];
	// 	}

	// 	// Step 4: Append secret key
	// 	dataString += this.SECRET_KEY;

	// 	// Step 5: Compute HMAC-SHA256
	// 	const signature = crypto
	// 		.createHmac('sha256', this.SECRET_KEY)
	// 		.update(dataString)
	// 		.digest('hex');

	// 	this.logger.debug('Signature created successfully');
	// 	return signature;
	// }

	private createSignature(fields: Record<string, string>): string {
		// Danh sách field cần ký theo thứ tự
		const signedFields = [
			'merchant',
			'operation',
			'payment_method', // Có thể không có
			'order_amount',
			'currency',
			'order_invoice_number',
			'order_description',
			'customer_id',
			'success_url',
			'error_url',
			'cancel_url',
		];

		const signedParts: string[] = [];

		// Tạo chuỗi field=value,field=value
		for (const field of signedFields) {
			if (fields[field] !== undefined && fields[field] !== '') {
				signedParts.push(`${field}=${fields[field]}`);
			}
		}

		const signedString = signedParts.join(',');

		this.logger.debug(`Signature string: ${signedString}`);

		// HMAC-SHA256 và encode base64
		const signature = crypto
			.createHmac('sha256', this.SECRET_KEY)
			.update(signedString)
			.digest('base64'); // QUAN TRỌNG: base64, không phải hex

		return signature;
	}

	/**
	 * Verify webhook signature
	 * Recreates signature from payload and compares with provided signature
	 */
	public verifySignature(
		params: Record<string, any>,
		providedSignature: string,
	): boolean {
		// const computedSignature = this.createSignature(params);
		// const isValid = computedSignature === providedSignature;

		// if (!isValid) {
		// 	this.logger.warn('Signature verification failed');
		// }

		// return isValid;

		try {
			const computedSignature = this.createSignature(params);
			const isValid = computedSignature === providedSignature;

			if (!isValid) {
				this.logger.warn('Callback signature verification failed');
				this.logger.debug(`Expected: ${computedSignature}`);
				this.logger.debug(`Received: ${providedSignature}`);
			}

			return isValid;
		} catch (error) {
			this.logger.error('Error verifying signature', error);
			return false;
		}
	}

	/**
	 * Prepare payment form data for Sepay
	 * Returns form data and checkout URL for frontend to submit
	 * Frontend will create HTML form and auto-submit to Sepay
	 */
	// preparePaymentForm(
	// 	orderId: string,
	// 	amount: number,
	// 	orderInfo: string,
	// ): { checkoutUrl: string; formData: Record<string, string> } {
	// 	// Prepare form data
	// 	const formData = {
	// 		client_id: this.MERCHANT_ID,
	// 		amount: String(amount),
	// 		order_id: orderId,
	// 		order_info: orderInfo,
	// 		callback_url: this.CALLBACK_URL,
	// 		return_url: this.RETURN_URL,
	// 	};

	// 	// Generate signature
	// 	const signature = this.createSignature(formData);

	// 	// Add signature to form data
	// 	const finalFormData = {
	// 		...formData,
	// 		signature,
	// 	};

	// 	this.logger.log(
	// 		`Payment form prepared for order ${orderId}, amount: ${amount}`,
	// 	);

	// 	return {
	// 		checkoutUrl: `${this.BASE_URL}/checkout`,
	// 		formData: finalFormData,
	// 	};
	// }

	preparePaymentForm(
		transactionId: string,
		amount: number,
		orderDescription: string,
		customerId?: string,
	): {
		checkoutUrl: string;
		formData: Record<string, string>;
	} {
		const formData = {
			merchant: this.MERCHANT_ID,
			currency: 'VND',
			order_amount: amount.toString(),
			operation: 'PURCHASE',
			order_description: orderDescription,
			order_invoice_number: transactionId, // UUID từ transaction
			customer_id: customerId || '',
			success_url: this.SUCCESS_URL,
			error_url: this.ERROR_URL,
			cancel_url: this.CANCEL_URL,
		};

		const signature = this.createSignature(formData);

		this.logger.log(
			`Prepared payment form for transaction ${transactionId}`,
		);

		return {
			checkoutUrl: this.CHECKOUT_URL,
			formData: {
				...formData,
				signature,
			},
		};
	}
}
