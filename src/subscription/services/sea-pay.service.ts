// sea-pay.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SePayPgClient } from 'sepay-pg-node';

@Injectable()
export class SeaPayService {
	private client: SePayPgClient;

	constructor(private readonly configService: ConfigService) {
		const env = this.configService.get<'sandbox' | 'production'>(
			'SEA_PAY_ENV',
			'sandbox',
		);
		const merchant_id = this.configService.get<string>('SEA_PAY_ID')!;
		const secret_key =
			this.configService.get<string>('SEA_PAY_SECRET_KEY')!;

		this.client = new SePayPgClient({
			env,
			merchant_id,
			secret_key,
		});
	}

	getClient(): SePayPgClient {
		return this.client;
	}

	/**
	 * Test kết nối bằng cách lấy danh sách đơn hàng (sandbox có thể rỗng)
	 */
	async testConnection() {
		try {
			const a = await this.client.order.all({ per_page: 1 }); // chỉ để test key/env
			console.log(a);
			return {
				success: true,
				message: 'Connection OK. Keys are valid.',
			};
		} catch (error) {
			return {
				success: false,
				message:
					'Connection failed. Check your SEA_PAY_ID / SEA_PAY_SECRET_KEY / ENV',
				error: error.message || error,
			};
		}
	}
}
