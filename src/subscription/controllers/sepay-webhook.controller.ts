import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Logger,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorator/auth.decorator';
import type { WebhookPayload } from '../services/webhook.service';
import { WebhookService } from '../services/webhook.service';

@ApiTags('Sepay Webhook')
@Controller('sepay')
export class SepayWebhookController {
	private readonly logger = new Logger(SepayWebhookController.name);

	constructor(private readonly webhookService: WebhookService) {}

	/**
	 * Webhook endpoint to receive payment notifications from Sepay
	 * This is a PUBLIC endpoint (no JWT required)
	 * Authentication is done via signature verification
	 */
	@Post('webhook')
	@Public()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sepay webhook endpoint (IPN)' })
	async handleWebhook(@Body() body: WebhookPayload) {
		this.logger.log('Received webhook from Sepay');
		return await this.webhookService.processWebhook(body);
	}
}
