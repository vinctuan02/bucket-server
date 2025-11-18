import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from '../dto/common.response-dto';

@ApiTags('Test')
@Controller('test')
export class TestController {
	@Get('success')
	@ApiOperation({ summary: 'Test success response' })
	@ApiResponse({ status: 200, description: 'Success response' })
	testSuccess() {
		return new ResponseSuccess({
			message: 'This is a success response',
			data: { test: 'data' },
		});
	}

	@Get('error')
	@ApiOperation({ summary: 'Test error response' })
	@ApiResponse({ status: 400, description: 'Error response' })
	testError() {
		throw new ResponseError({
			statusCode: 400,
			message: 'This is a test error message',
			messageCode: 'error',
		});
	}
}
