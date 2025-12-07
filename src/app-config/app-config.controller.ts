import { Body, Controller, Get, Put } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/auth/decorator/auth.decorator';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { UpdateAppConfigDto } from './dto/app-config.dto';
import { AppConfigService } from './services/app-config.service';

@ApiTags('App Config')
@Controller('app-config')
export class AppConfigController {
	constructor(private readonly appConfigService: AppConfigService) {}

	@Public()
	@Get()
	@ApiOperation({ summary: 'Get app configuration' })
	@ApiResponse({ status: 200, description: 'App configuration' })
	async getConfig() {
		const data = await this.appConfigService.getConfig();
		return new ResponseSuccess({ data });
	}

	@ApiBearerAuth()
	@Put()
	@ApiOperation({ summary: 'Update app configuration' })
	@ApiBody({ type: UpdateAppConfigDto })
	@ApiResponse({ status: 200, description: 'Config updated successfully' })
	async update(@Body() dto: UpdateAppConfigDto) {
		const data = await this.appConfigService.updateConfig(dto);
		return new ResponseSuccess({ data });
	}
}
