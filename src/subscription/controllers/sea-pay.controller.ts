// sea-pay.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SeaPayService } from '../services/sea-pay.service';

@Controller('seapay')
export class SeaPayController {
	constructor(private readonly seaPayService: SeaPayService) {}

	@Get('test')
	async test() {
		return this.seaPayService.testConnection();
	}
}
