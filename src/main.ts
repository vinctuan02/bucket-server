import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		rawBody: true, // Enable raw body for webhook signature verification
	});
	// app.enableCors({
	// 	origin: true,
	// 	credentials: true,
	// });

	app.enableCors({
		origin: '*', // Hoặc true
		credentials: true,
	});

	// Configure raw body for webhook endpoint
	app.use('/sepay/webhook', express.json({ verify: rawBodyBuffer }));
	app.use(express.json());
	app.useGlobalFilters(new HttpExceptionFilter());
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	// Swagger setup
	const config = new DocumentBuilder()
		.setTitle('File Storage API')
		.setDescription('API documentation for file storage system')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api-docs', app, document);

	await app.listen(process.env.PORT ?? 3000);
}

// Helper function to preserve raw body for webhook signature verification
function rawBodyBuffer(req: any, res: any, buf: Buffer, encoding: string) {
	if (buf && buf.length) {
		req.rawBody = buf;
	}
}

void bootstrap();
