import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class UpdateAppConfigDto {
	@ApiProperty({
		example: 30,
		description: 'Number of days before permanent deletion from trash',
	})
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	trashRetentionDays: number;

	@ApiProperty({
		example: 'http://103.75.182.213:9000/public/icon.png',
		description: 'Website icon URL',
		required: false,
	})
	@IsOptional()
	icon?: string | null;
}

export class AppConfigResponseDto {
	@ApiProperty({
		example: 30,
		description: 'Number of days before permanent deletion from trash',
	})
	trashRetentionDays: number;

	@ApiProperty({
		example: 'http://103.75.182.213:9000/public/icon.png',
		description: 'Website icon URL',
	})
	icon: string | null;
}
