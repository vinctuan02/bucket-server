import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		// If response is already formatted (from ResponseError), use it as-is
		if (
			typeof exceptionResponse === 'object' &&
			'statusCode' in exceptionResponse &&
			'message' in exceptionResponse
		) {
			return response.status(status).json(exceptionResponse);
		}

		// Otherwise, format the response
		const errorResponse = {
			statusCode: status,
			message:
				typeof exceptionResponse === 'string'
					? exceptionResponse
					: (exceptionResponse as any)?.message ||
						'Internal Server Error',
			messageCode: 'error',
			timestamp: new Date().toISOString(),
		};

		this.logger.error(
			`[${status}] ${errorResponse.message}`,
			exception.stack,
		);

		response.status(status).json(errorResponse);
	}
}
