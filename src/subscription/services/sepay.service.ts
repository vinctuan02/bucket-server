import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class SepayService {
	private readonly logger = new Logger(SepayService.name);
	private readonly BASE_URL: string;
	private readonly MERCHANT_ID: string;
	private readonly SECRET_KEY: string;
	private readonly CALLBACK_URL: string;
	private readonly RETURN_URL: string;

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
	public createSignature(params: Record<string, any>): string {
		// Step 1 & 2: Collect and sort keys
		const sortedKeys = Object.keys(params)
			.filter((key) => key !== 'signature' && key !== 'checksum')
			.sort();

		// Step 3: Concatenate values
		let dataString = '';
		for (const key of sortedKeys) {
			dataString += params[key];
		}

		// Step 4: Append secret key
		dataString += this.SECRET_KEY;

		// Step 5: Compute HMAC-SHA256
		const signature = crypto
			.createHmac('sha256', this.SECRET_KEY)
			.update(dataString)
			.digest('hex');

		this.logger.debug('Signature created successfully');
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
		const computedSignature = this.createSignature(params);
		const isValid = computedSignature === providedSignature;

		if (!isValid) {
			this.logger.warn('Signature verification failed');
		}

		return isValid;
	}

	/**
	 * Initiate payment with Sepay
	 * Sends POST request to Sepay checkout initialization endpoint
	 */
	async initiatePayment(
		orderId: string,
		amount: number,
		orderInfo: string,
	): Promise<{ paymentUrl: string }> {
		try {
			// Prepare payload
			const payload = {
				client_id: this.MERCHANT_ID,
				amount: amount,
				order_id: orderId,
				order_info: orderInfo,
				callback_url: this.CALLBACK_URL,
				return_url: this.RETURN_URL,
			};

			// Generate signature
			const signature = this.createSignature(payload);

			// Add signature to payload
			const finalPayload = {
				...payload,
				signature,
			};

			this.logger.log(
				`Initiating payment for order ${orderId}, amount: ${amount}`,
			);

			// Send request to Sepay
			const response = await axios.post(
				`${this.BASE_URL}/v1/checkout/init`,
				finalPayload,
				{
					headers: {
						Authorization: this.createBasicAuthHeader(),
						'Content-Type': 'application/json',
					},
				},
			);

			// Extract payment URL from response
			const paymentUrl = response.data.payment_url;

			if (!paymentUrl) {
				throw new Error('Payment URL not found in Sepay response');
			}

			this.logger.log(
				`Payment initiated successfully for order ${orderId}`,
			);

			return { paymentUrl };
		} catch (error) {
			this.logger.error(
				`Failed to initiate payment for order ${orderId}`,
				error,
			);

			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				this.logger.error(
					`Sepay API error: ${axiosError.response?.status} - ${JSON.stringify(axiosError.response?.data)}`,
				);
			}

			throw error;
		}
	}
}
